using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Taek.Api.Attributes;
using Taek.Api.Models.Db;
using Taek.Api.Models.Profiles;

namespace Taek.Api.Controllers;

[ApiController]
[Route("coaches")]
[AuthorizeRole("coach")]
public class CoachesController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly Services.SupabaseStorageService _storage;

    public CoachesController(Supabase.Client supabase, Services.SupabaseStorageService storage)
    {
        _supabase = supabase;
        _storage = storage;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        var appUser = await _supabase.From<AppUser>().Where(u => u.Id == userId).Single();

        return Ok(new
        {
            user = new { id = appUser?.Id ?? userId, email = appUser?.Email, full_name = appUser?.FullName, role = appUser?.Role },
            profile
        });
    }

    [HttpPost("profile")]
    public async Task<IActionResult> CreateProfile([FromBody] UpsertCoachProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var existing = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        if (existing != null)
        {
            return Conflict(new { error = "Profile already exists." });
        }

        await UpsertUserFullName(userId, request.FullName);

        var profile = new CoachProfile
        {
            UserId = userId,
            LicenceNo = request.LicenceNo,
            BeltRank = request.BeltRank?.ToLowerInvariant(),
            AffiliatedClubId = request.AffiliatedClubId,
            State = request.State,
            Phone = request.Phone,
            AvatarUrl = request.AvatarUrl,
            Verified = false
        };

        await _supabase.From<CoachProfile>().Insert(profile);

        var created = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        if (created == null)
        {
            return StatusCode(500, new { error = "Failed to create profile." });
        }

        return Ok(created);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpsertCoachProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        await UpsertUserFullName(userId, request.FullName);

        profile.LicenceNo = request.LicenceNo ?? profile.LicenceNo;
        profile.BeltRank = request.BeltRank?.ToLowerInvariant() ?? profile.BeltRank;
        profile.AffiliatedClubId = request.AffiliatedClubId ?? profile.AffiliatedClubId;
        profile.State = request.State ?? profile.State;
        profile.Phone = request.Phone ?? profile.Phone;
        profile.AvatarUrl = request.AvatarUrl ?? profile.AvatarUrl;

        await _supabase.From<CoachProfile>().Update(profile);

        var updated = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        return Ok(updated);
    }

    [HttpGet("athletes")]
    public async Task<IActionResult> GetAthletes()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var roster = await _supabase.From<CoachRosterEntry>()
            .Where(r => r.CoachUserId == userId)
            .Get();

        var entries = new List<object>();
        foreach (var entry in roster.Models.Where(e => e.Status != "removed"))
        {
            var athleteUser = await _supabase.From<AppUser>().Where(u => u.Id == entry.PlayerUserId).Single();
            var athleteProfile = await _supabase.From<PlayerProfile>().Where(p => p.UserId == entry.PlayerUserId).Single();

            entries.Add(new
            {
                id = entry.Id,
                player_user_id = entry.PlayerUserId,
                status = entry.Status,
                player = athleteUser == null ? null : new { 
                    id = athleteUser.Id, 
                    email = athleteUser.Email, 
                    full_name = athleteUser.FullName,
                    belt_rank = athleteProfile?.BeltRank,
                    weight_kg = athleteProfile?.WeightKg,
                    gender = athleteProfile?.Gender,
                    avatar_url = athleteProfile?.AvatarUrl
                }
            });
        }

        return Ok(entries);
    }

    [HttpPost("athletes/invite")]
    public async Task<IActionResult> InviteAthlete([FromBody] InviteAthleteRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var athlete = await _supabase.From<AppUser>().Where(u => u.Email == request.Email).Single();
        if (athlete == null)
        {
            return NotFound(new { error = "Player not found." });
        }

        var existing = await _supabase.From<CoachRosterEntry>()
            .Where(r => r.CoachUserId == userId && r.PlayerUserId == athlete.Id)
            .Single();

        if (existing != null && existing.Status != "removed" && existing.Status != "declined")
        {
            return Ok(existing);
        }

        if (existing != null)
        {
            // Re-invite
            existing.Status = "pending";
            existing.InvitedAt = DateTime.UtcNow;
            existing.RespondedAt = null;
            await _supabase.From<CoachRosterEntry>().Update(existing);
            return Ok(existing);
        }

        var entry = new CoachRosterEntry
        {
            CoachUserId = userId,
            PlayerUserId = athlete.Id,
            Status = "pending",
            InvitedAt = DateTime.UtcNow
        };

        await _supabase.From<CoachRosterEntry>().Insert(entry);

        var created = await _supabase.From<CoachRosterEntry>()
            .Where(r => r.CoachUserId == userId && r.PlayerUserId == athlete.Id)
            .Single();

        return Ok(created);
    }

    [HttpDelete("athletes/{id}")]
    public async Task<IActionResult> RemoveAthlete([FromRoute] string id)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var entry = await _supabase.From<CoachRosterEntry>().Where(r => r.Id == id && r.CoachUserId == userId).Single();
        if (entry == null)
        {
            return NotFound();
        }

        entry.Status = "removed";
        await _supabase.From<CoachRosterEntry>().Update(entry);

        return Ok(new { message = "Removed" });
    }

    [HttpPost("profile/photo")]
    public async Task<IActionResult> UploadPhoto(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<CoachProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        var ext = Path.GetExtension(file.FileName);
        var objectPath = $"coaches/{userId}/{Guid.NewGuid():N}{ext}";
        var url = await _storage.UploadAsync("profile-uploads", objectPath, file, cancellationToken);

        profile.AvatarUrl = url;
        await _supabase.From<CoachProfile>().Update(profile);

        return Ok(new { avatar_url = url });
    }

    private async Task UpsertUserFullName(string userId, string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return;
        }

        var appUser = await _supabase.From<AppUser>().Where(u => u.Id == userId).Single();
        if (appUser == null)
        {
            return;
        }

        if (!string.Equals(appUser.FullName, fullName, StringComparison.Ordinal))
        {
            appUser.FullName = fullName;
            await _supabase.From<AppUser>().Update(appUser);
        }
    }
}

