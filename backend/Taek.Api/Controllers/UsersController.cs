using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Taek.Api.Models.Db;
using Taek.Api.Models.Auth;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly ILogger<UsersController> _logger;
    private readonly IConfiguration _configuration;

    public UsersController(Supabase.Client supabase, ILogger<UsersController> logger, IConfiguration configuration)
    {
        _supabase = supabase;
        _logger = logger;
        _configuration = configuration;
    }

    // ─── GET /api/users/me ────────────────────────────────────────────────────

    /// <summary>
    /// Returns the current authenticated user's profile.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Single();

            if (user == null) return NotFound(new { error = "User profile not found." });

            return Ok(new UserProfileResponse(
                user.Id,
                user.Email,
                user.FullName,
                user.Phone,
                user.Role,
                user.ForcePasswordChange
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user profile");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── PUT /api/users/me ────────────────────────────────────────────────────

    /// <summary>
    /// Updates the current user's name and phone.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Single();

            if (user == null) return NotFound(new { error = "User profile not found." });

            // Club and organiser cannot change their own name via this endpoint
            // Admin manages their profile
            if (user.Role is "club" or "organiser" or "admin")
                return Forbid();

            await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Set(x => x.FullName, request.FullName ?? user.FullName)
                .Set(x => x.Phone, request.Phone ?? user.Phone)
                .Update();

            var updatedUser = await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Single();

            if (updatedUser == null) return NotFound(new { error = "User profile not found after update." });

            return Ok(new UserProfileResponse(
                updatedUser.Id,
                updatedUser.Email,
                updatedUser.FullName,
                updatedUser.Phone,
                updatedUser.Role,
                updatedUser.ForcePasswordChange
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user profile");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── PATCH /api/users/me/upgrade-to-parent ────────────────────────────────

    /// <summary>
    /// Upgrades an individual account to parent. One-way, cannot be reversed.
    /// </summary>
    [HttpPatch("me/upgrade-to-parent")]
    public async Task<IActionResult> UpgradeToParent()
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Single();

            if (user == null) return NotFound(new { error = "User profile not found." });

            if (user.Role != "individual")
                return BadRequest(new { error = "Only individual accounts can be upgraded to parent." });

            await _supabase.From<AppUser>()
                .Where(x => x.Id == userId)
                .Set(x => x.Role, "parent")
                .Update();

            return Ok(new { message = "Account upgraded to parent successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upgrade to parent");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── POST /api/users/me/change-password ───────────────────────────────────

    /// <summary>
    /// Changes password and clears force_password_change flag.
    /// Used by club/organiser on first login.
    /// </summary>
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Use Admin API to update password — service role key required
            var serviceKey = _configuration["Supabase:ServiceRoleKey"]!;
            var adminAuth  = _supabase.AdminAuth(serviceKey);

            var attrs = new Supabase.Gotrue.AdminUserAttributes
            {
                Password = request.Password
            };

            var updated = await adminAuth.UpdateUserById(userId, attrs);

            if (updated == null)
                return BadRequest(new { error = "Failed to update password." });

            // Clear force_password_change via direct HTTP
            var supabaseUrl = _configuration["Supabase:Url"]!;
            using var http  = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceKey);
            http.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceKey}");
            http.DefaultRequestHeaders.Add("Prefer", "return=minimal");

            var body = JsonSerializer.Serialize(new { force_password_change = false });
            await http.PatchAsync(
                $"{supabaseUrl}/rest/v1/users?id=eq.{userId}",
                new StringContent(body, Encoding.UTF8, "application/json")
            );

            _logger.LogInformation("User {UserId} changed password", userId);
            return Ok(new { message = "Password changed successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to change password");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private string? GetUserId() =>
        User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
}

public record UserProfileResponse(
    string Id,
    string Email,
    string? FullName,
    string? Phone,
    string Role,
    bool ForcePasswordChange
);
