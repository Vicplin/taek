using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Supabase.Gotrue;
using Supabase.Postgrest;
using Taek.Api.Models.Auth;
using Taek.Api.Models.Db;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminController> _logger;

    // Allowed email domains per role
    private static readonly Dictionary<string, string> RoleDomains = new()
    {
        { "club",      "@taekclub.com" },
        { "organiser", "@taekorg.com"  }
    };

    public AdminController(Supabase.Client supabase, IConfiguration configuration, ILogger<AdminController> logger)
    {
        _supabase = supabase;
        _configuration = configuration;
        _logger = logger;
    }

    // ─── GET /api/admin/users ─────────────────────────────────────────────────

    /// <summary>
    /// Returns all users. Admin only.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        try
        {
            var response = await _supabase.From<AppUser>()
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return Ok(response.Models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch users");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── GET /api/admin/users/{role} ──────────────────────────────────────────

    /// <summary>
    /// Returns users filtered by role. Admin only.
    /// </summary>
    [HttpGet("users/{role}")]
    public async Task<IActionResult> GetUsersByRole(string role)
    {
        var validRoles = new[] { "individual", "parent", "club", "organiser", "admin" };
        if (!validRoles.Contains(role))
            return BadRequest(new { error = $"Invalid role '{role}'." });

        try
        {
            var response = await _supabase.From<AppUser>()
                .Filter("role", Supabase.Postgrest.Constants.Operator.Equals, role)
                .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return Ok(response.Models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch users by role");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── POST /api/admin/create-account ──────────────────────────────────────

    /// <summary>
    /// Creates a club or organiser account with enforced email domain and temp password.
    /// Admin only.
    /// </summary>
    [HttpPost("create-account")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
    {
        // Only club and organiser can be created this way
        if (!RoleDomains.ContainsKey(request.Role))
            return BadRequest(new { error = "Invalid role. Only 'club' or 'organiser' accounts can be created here." });

        // Enforce email domain
        var requiredDomain = RoleDomains[request.Role];
        if (!request.Email.EndsWith(requiredDomain, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = $"Email for role '{request.Role}' must end with {requiredDomain}." });

        try
        {
            // Auto-generate a secure 12-char temp password
            var tempPassword = GenerateTempPassword();

            var serviceKey = _configuration["Supabase:ServiceRoleKey"];
            if (string.IsNullOrEmpty(serviceKey))
                return StatusCode(500, new { error = "Server configuration error." });

            var adminAuth = _supabase.AdminAuth(serviceKey);

            // Create the auth user — email confirmed, no verification email needed
            var adminAttrs = new AdminUserAttributes
            {
                Email = request.Email,
                Password = tempPassword,
                EmailConfirm = true,
                UserMetadata = new Dictionary<string, object>
                {
                    { "full_name", request.FullName },
                    { "phone",     request.Phone ?? "" },
                    { "role",      "individual" } // trigger sets individual, we override below
                }
            };

            var user = await adminAuth.CreateUser(adminAttrs);

            if (user?.Id == null)
                return BadRequest(new { error = "Failed to create account in Supabase Auth." });

            var supabaseUrl = _configuration["Supabase:Url"]!;

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceKey);
            http.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceKey}");
            http.DefaultRequestHeaders.Add("Prefer", "return=minimal");

            var updateUrl = $"{supabaseUrl}/rest/v1/users?id=eq.{user.Id}";
            var updateBody = JsonSerializer.Serialize(new
            {
                role = request.Role,
                force_password_change = true
            });

            using var updateRequest = new HttpRequestMessage(new HttpMethod("PATCH"), updateUrl)
            {
                Content = new StringContent(updateBody, Encoding.UTF8, "application/json")
            };

            var updateResponse = await http.SendAsync(updateRequest);
            if (!updateResponse.IsSuccessStatusCode)
            {
                var err = await updateResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to update role for {UserId}: {Error}", user.Id, err);
                return BadRequest(new { error = "Account created but failed to set role." });
            }

            _logger.LogInformation("Admin created {Role} account for {Email}", request.Role, request.Email);

            return Ok(new
            {
                message  = $"{request.Role} account created successfully.",
                userId   = user.Id,
                email    = request.Email,
                tempPassword  // Admin copies this and sends to the club/organiser
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create account for {Email}", request.Email);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── PUT /api/admin/users/{id}/role ───────────────────────────────────────

    /// <summary>
    /// Manually updates a user's role. Admin only.
    /// </summary>
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleRequest request)
    {
        var validRoles = new[] { "individual", "parent", "club", "organiser", "admin" };
        if (!validRoles.Contains(request.Role))
            return BadRequest(new { error = $"Invalid role '{request.Role}'." });

        try
        {
            await _supabase.From<AppUser>()
                .Where(x => x.Id == id)
                .Set(x => x.Role, request.Role)
                .Update();

            return Ok(new { message = $"User {id} role updated to {request.Role}." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update role for user {Id}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static string GenerateTempPassword(int length = 12)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        return RandomNumberGenerator.GetString(chars, length);
    }
}
