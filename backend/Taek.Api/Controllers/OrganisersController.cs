using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Taek.Api.Attributes;
using Taek.Api.Models.Db;
using Taek.Api.Models.Profiles;
using Taek.Api.Services;

namespace Taek.Api.Controllers;

[ApiController]
[Route("organisers")]
[AuthorizeRole("organiser")]
public class OrganisersController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly SupabaseStorageService _storage;

    public OrganisersController(Supabase.Client supabase, SupabaseStorageService storage)
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

        var profile = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
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
    public async Task<IActionResult> CreateProfile([FromBody] UpsertOrganiserProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var existing = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
        if (existing != null)
        {
            return Conflict(new { error = "Profile already exists." });
        }

        var profile = new OrganiserProfile
        {
            UserId = userId,
            OrgName = request.OrgName,
            LogoUrl = request.LogoUrl,
            ContactName = request.ContactName,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            State = request.State,
            VerificationStatus = "pending"
        };

        await _supabase.From<OrganiserProfile>().Insert(profile);

        var created = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
        if (created == null)
        {
            return StatusCode(500, new { error = "Failed to create profile." });
        }

        return Ok(created);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpsertOrganiserProfileRequest request)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        profile.OrgName = request.OrgName;
        profile.LogoUrl = request.LogoUrl ?? profile.LogoUrl;
        profile.ContactName = request.ContactName ?? profile.ContactName;
        profile.ContactEmail = request.ContactEmail ?? profile.ContactEmail;
        profile.ContactPhone = request.ContactPhone ?? profile.ContactPhone;
        profile.State = request.State ?? profile.State;

        await _supabase.From<OrganiserProfile>().Update(profile);

        var updated = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
        return Ok(updated);
    }

    [HttpPost("profile/logo")]
    public async Task<IActionResult> UploadLogo(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var profile = await _supabase.From<OrganiserProfile>().Where(p => p.UserId == userId).Single();
        if (profile == null)
        {
            return NotFound();
        }

        var ext = Path.GetExtension(file.FileName);
        var objectPath = $"organisers/{userId}/logo-{Guid.NewGuid():N}{ext}";
        var url = await _storage.UploadAsync("profile-uploads", objectPath, file, cancellationToken);

        profile.LogoUrl = url;
        await _supabase.From<OrganiserProfile>().Update(profile);

        return Ok(new { logo_url = url });
    }
}

