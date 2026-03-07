using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Taek.Api.Attributes;
using Taek.Api.Models.Profiles;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/organisers")]
[AuthorizeRole("organiser")]
public class OrganisersController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public OrganisersController(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    // ─────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────

    private HttpClient CreateServiceClient()
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", ServiceKey);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", ServiceKey);
        return client;
    }

    private string? GetUserId() => User.FindFirstValue("sub");

    // ─────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────

    /// <summary>GET /api/organisers/profile</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/organiser_profiles?user_id=eq.{userId}&select=*&limit=1";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        if (rows == null || rows.Count == 0)
            return NotFound(new { error = "Organiser profile not found." });

        return Ok(rows[0]);
    }

    /// <summary>POST /api/organisers/profile — create profile (first time)</summary>
    [HttpPost("profile")]
    public async Task<IActionResult> CreateProfile([FromBody] UpsertOrganiserProfileRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        // Check if profile already exists
        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/organiser_profiles?user_id=eq.{userId}&select=id&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var existing = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);

        if (existing != null && existing.Count > 0)
            return Conflict(new { error = "Profile already exists. Use PUT to update." });

        var payload = new
        {
            user_id = userId,
            org_name = request.OrgName,
            contact_name = request.ContactName,
            contact_email = request.ContactEmail,
            contact_phone = request.ContactPhone,
            state = request.State
        };

        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{SupabaseUrl}/rest/v1/organiser_profiles", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }

    /// <summary>PUT /api/organisers/profile — update profile</summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpsertOrganiserProfileRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        // Check profile exists
        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/organiser_profiles?user_id=eq.{userId}&select=id&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var existing = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);

        if (existing == null || existing.Count == 0)
            return NotFound(new { error = "Profile not found. Use POST to create." });

        var payload = new Dictionary<string, object?>();
        if (!string.IsNullOrWhiteSpace(request.OrgName)) payload["org_name"] = request.OrgName;
        if (request.ContactName != null) payload["contact_name"] = request.ContactName;
        if (request.ContactEmail != null) payload["contact_email"] = request.ContactEmail;
        if (request.ContactPhone != null) payload["contact_phone"] = request.ContactPhone;
        if (request.State != null) payload["state"] = request.State;
        payload["updated_at"] = DateTime.UtcNow;

        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var url = $"{SupabaseUrl}/rest/v1/organiser_profiles?user_id=eq.{userId}";
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }
}
