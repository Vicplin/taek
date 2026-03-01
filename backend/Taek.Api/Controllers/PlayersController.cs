using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Taek.Api.Attributes;
using Taek.Api.Models.Db;
using Taek.Api.Models.Profiles;
using Taek.Api.Services;

namespace Taek.Api.Controllers;

[ApiController]
[Route("players")]
[AuthorizeRole("player")]
public class PlayersController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly SupabaseStorageService _storage;

    public PlayersController(Supabase.Client supabase, SupabaseStorageService storage)
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

        var profile = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
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
    public async Task<IActionResult> CreateProfile([FromBody] UpsertPlayerProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var existing = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (existing != null)
        {
            return Conflict(new { error = "Profile already exists." });
        }

        await UpsertUserFullName(userId, request.FullName);

        var profile = new PlayerProfile
        {
            UserId = userId,
            ClubId = request.ClubId,
            DateOfBirth = request.Dob,
            IcNumber = request.IcNumber,
            Nationality = request.Nationality,
            Gender = request.Gender?.ToLowerInvariant(),
            Phone = request.Phone,
            BeltRank = request.BeltRank?.ToLowerInvariant(),
            WeightKg = request.WeightKg,
            State = request.State,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone
        };

        await _supabase.From<PlayerProfile>().Insert(profile);

        var created = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (created == null)
        {
            return StatusCode(500, new { error = "Failed to create profile." });
        }

        if (!string.IsNullOrWhiteSpace(created.BeltRank))
        {
            await _supabase.From<BeltHistoryEntry>().Insert(new BeltHistoryEntry
            {
                PlayerId = created.Id,
                BeltColor = created.BeltRank,
                AwardedAt = DateTime.UtcNow.Date
            });
        }

        if (created.WeightKg.HasValue)
        {
            await _supabase.From<WeightHistoryEntry>().Insert(new WeightHistoryEntry
            {
                PlayerId = created.Id,
                WeightKg = created.WeightKg.Value,
                RecordedAt = DateTime.UtcNow
            });
        }

        return Ok(created);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpsertPlayerProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        await UpsertUserFullName(userId, request.FullName);

        var prevBelt = profile.BeltRank;
        var prevWeight = profile.WeightKg;

        profile.ClubId = request.ClubId ?? profile.ClubId;
        profile.DateOfBirth = request.Dob ?? profile.DateOfBirth;
        profile.IcNumber = request.IcNumber ?? profile.IcNumber;
        profile.Nationality = request.Nationality ?? profile.Nationality;
        profile.Gender = request.Gender?.ToLowerInvariant() ?? profile.Gender;
        profile.Phone = request.Phone ?? profile.Phone;
        profile.BeltRank = request.BeltRank?.ToLowerInvariant() ?? profile.BeltRank;
        profile.WeightKg = request.WeightKg ?? profile.WeightKg;
        profile.State = request.State ?? profile.State;
        profile.EmergencyContactName = request.EmergencyContactName ?? profile.EmergencyContactName;
        profile.EmergencyContactPhone = request.EmergencyContactPhone ?? profile.EmergencyContactPhone;

        await _supabase.From<PlayerProfile>().Update(profile);

        var updated = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (updated == null)
        {
            return StatusCode(500, new { error = "Failed to update profile." });
        }

        if (!string.Equals(prevBelt, updated.BeltRank, StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(updated.BeltRank))
        {
            await _supabase.From<BeltHistoryEntry>().Insert(new BeltHistoryEntry
            {
                PlayerId = updated.Id,
                BeltColor = updated.BeltRank,
                AwardedAt = DateTime.UtcNow.Date
            });
        }

        if (prevWeight != updated.WeightKg && updated.WeightKg.HasValue)
        {
            await _supabase.From<WeightHistoryEntry>().Insert(new WeightHistoryEntry
            {
                PlayerId = updated.Id,
                WeightKg = updated.WeightKg.Value,
                RecordedAt = DateTime.UtcNow
            });
        }

        return Ok(updated);
    }

    [HttpPost("profile/photo")]
    public async Task<IActionResult> UploadPhoto(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        var ext = Path.GetExtension(file.FileName);
        var objectPath = $"players/{userId}/{Guid.NewGuid():N}{ext}";
        var url = await _storage.UploadAsync("profile-uploads", objectPath, file, cancellationToken);

        profile.AvatarUrl = url;
        await _supabase.From<PlayerProfile>().Update(profile);

        return Ok(new { avatar_url = url });
    }

    [HttpGet("belt-history")]
    public async Task<IActionResult> GetBeltHistory()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<PlayerProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        var history = await _supabase.From<BeltHistoryEntry>().Where(h => h.PlayerId == profile.Id).Get();
        return Ok(history.Models);
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> GetInvitations()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var invitations = await _supabase.From<CoachRosterEntry>()
            .Where(r => r.PlayerUserId == userId && r.Status == "pending")
            .Get();

        var result = new List<object>();
        foreach (var inv in invitations.Models)
        {
            var coach = await _supabase.From<AppUser>().Where(u => u.Id == inv.CoachUserId).Single();
            result.Add(new {
                id = inv.Id,
                coach_user_id = inv.CoachUserId,
                coach_name = coach?.FullName ?? coach?.Email,
                status = inv.Status,
                invited_at = inv.InvitedAt
            });
        }

        return Ok(result);
    }

    [HttpPost("invitations/{id}/respond")]
    public async Task<IActionResult> RespondToInvitation(string id, [FromBody] RespondInvitationRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var invitation = await _supabase.From<CoachRosterEntry>()
            .Where(r => r.Id == id && r.PlayerUserId == userId)
            .Single();

        if (invitation == null)
        {
            return NotFound();
        }

        if (invitation.Status != "pending")
        {
            return BadRequest("Invitation is not pending.");
        }

        if (request.Accept)
        {
            invitation.Status = "accepted";
            invitation.RespondedAt = DateTime.UtcNow;
        }
        else
        {
            invitation.Status = "declined";
            invitation.RespondedAt = DateTime.UtcNow;
        }

        await _supabase.From<CoachRosterEntry>().Update(invitation);

        return Ok(invitation);
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

