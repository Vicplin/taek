using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Taek.Api.Attributes;
using Taek.Api.Services;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/clubs")]
[AuthorizeRole("club")]
public class ClubsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly SupabaseStorageService _storage;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public ClubsController(IHttpClientFactory httpClientFactory, IConfiguration config, SupabaseStorageService storage)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _storage = storage;
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

    private async Task<string?> GetClubIdAsync(string userId)
    {
        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/clubs?user_id=eq.{userId}&select=id&limit=1";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        if (rows == null || rows.Count == 0) return null;
        return rows[0].GetProperty("id").GetString();
    }

    // ─────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────

    /// <summary>GET /api/clubs/profile</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/clubs?user_id=eq.{userId}&select=*&limit=1";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        if (rows == null || rows.Count == 0)
            return NotFound(new { error = "Club profile not found." });

        return Ok(rows[0]);
    }

    /// <summary>PUT /api/clubs/profile</summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateClubProfileRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var payload = new Dictionary<string, object?>();
        if (!string.IsNullOrWhiteSpace(request.Name)) payload["name"] = request.Name;
        if (request.ContactEmail != null) payload["contact_email"] = request.ContactEmail;
        if (request.ContactPhone != null) payload["contact_phone"] = request.ContactPhone;
        payload["updated_at"] = DateTime.UtcNow;

        var client = CreateServiceClient();
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");

        var url = $"{SupabaseUrl}/rest/v1/clubs?id=eq.{clubId}";
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }

    // ─────────────────────────────────────────────
    // PLAYERS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/clubs/players</summary>
    [HttpGet("players")]
    public async Task<IActionResult> GetPlayers()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/players?club_id=eq.{clubId}&select=*&order=full_name.asc";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    // ─────────────────────────────────────────────
    // REGISTRATIONS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/clubs/registrations — optionally filter by ?tournament_id=xxx</summary>
    [HttpGet("registrations")]
    public async Task<IActionResult> GetRegistrations([FromQuery] string? tournament_id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var filter = tournament_id != null ? $"&tournament_id=eq.{tournament_id}" : "";
        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations?club_id=eq.{clubId}{filter}&select=*&order=created_at.desc";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    /// <summary>PATCH /api/clubs/registrations/{id}/verify — pending → club_verified</summary>
    [HttpPatch("registrations/{id}/verify")]
    public async Task<IActionResult> VerifyRegistration(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        // Confirm this registration belongs to this club and is pending
        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}&club_id=eq.{clubId}&select=id,status&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var rows = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);

        if (rows == null || rows.Count == 0)
            return NotFound(new { error = "Registration not found." });

        var currentStatus = rows[0].GetProperty("status").GetString();
        if (currentStatus != "pending")
            return BadRequest(new { error = $"Cannot verify a registration with status '{currentStatus}'. Must be 'pending'." });

        var payload = new { status = "club_verified", updated_at = DateTime.UtcNow };
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}";
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var updated = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(updated?[0]);
    }

    /// <summary>PATCH /api/clubs/registrations/{id}/reject — pending → rejected</summary>
    [HttpPatch("registrations/{id}/reject")]
    public async Task<IActionResult> RejectRegistration(string id, [FromBody] RejectRegistrationRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}&club_id=eq.{clubId}&select=id,status&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var rows = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);

        if (rows == null || rows.Count == 0)
            return NotFound(new { error = "Registration not found." });

        var currentStatus = rows[0].GetProperty("status").GetString();
        if (currentStatus != "pending")
            return BadRequest(new { error = $"Cannot reject a registration with status '{currentStatus}'. Must be 'pending'." });

        var payload = new
        {
            status = "rejected",
            rejection_reason = request.Reason,
            updated_at = DateTime.UtcNow
        };

        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}";
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var updated = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(updated?[0]);
    }

    /// <summary>PATCH /api/clubs/registrations/{id}/payment-submitted — club_verified → payment_submitted</summary>
    [HttpPatch("registrations/{id}/payment-submitted")]
    public async Task<IActionResult> MarkPaymentSubmitted(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}&club_id=eq.{clubId}&select=id,status&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var rows = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);

        if (rows == null || rows.Count == 0)
            return NotFound(new { error = "Registration not found." });

        var currentStatus = rows[0].GetProperty("status").GetString();
        if (currentStatus != "club_verified")
            return BadRequest(new { error = $"Cannot mark payment submitted for status '{currentStatus}'. Must be 'club_verified'." });

        var payload = new { status = "payment_submitted", updated_at = DateTime.UtcNow };
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}";
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var updated = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(updated?[0]);
    }

    // ─────────────────────────────────────────────
    // PAYMENTS
    // ─────────────────────────────────────────────

    /// <summary>
    /// POST /api/clubs/payments
    /// Upload receipt → inserts club_payment → auto-approves all payment_submitted registrations for this club+tournament
    /// </summary>
    [HttpPost("payments")]
    public async Task<IActionResult> UploadPayment(
        [FromForm] string tournament_id,
        [FromForm] decimal total_amount,
        IFormFile receipt,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        // Upload receipt to Supabase Storage
        string receiptUrl;
        try
        {
            var ext = Path.GetExtension(receipt.FileName);
            var objectPath = $"receipts/{clubId}/{tournament_id}-{Guid.NewGuid():N}{ext}";
            receiptUrl = await _storage.UploadAsync("club-receipts", objectPath, receipt, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var client = CreateServiceClient();

        // Insert club_payment record
        var paymentPayload = new
        {
            club_id = clubId,
            tournament_id,
            receipt_url = receiptUrl,
            total_amount,
            uploaded_at = DateTime.UtcNow
        };

        var paymentContent = new StringContent(JsonSerializer.Serialize(paymentPayload), Encoding.UTF8, "application/json");
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var paymentResponse = await client.PostAsync($"{SupabaseUrl}/rest/v1/club_payments", paymentContent);
        var paymentBody = await paymentResponse.Content.ReadAsStringAsync();

        if (!paymentResponse.IsSuccessStatusCode)
            return StatusCode((int)paymentResponse.StatusCode, new { error = paymentBody });

        // Auto-approve all payment_submitted registrations for this club + tournament
        var approvePayload = new { status = "approved", updated_at = DateTime.UtcNow };
        var approveContent = new StringContent(JsonSerializer.Serialize(approvePayload), Encoding.UTF8, "application/json");
        var approveUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?club_id=eq.{clubId}&tournament_id=eq.{tournament_id}&status=eq.payment_submitted";

        // Need a fresh client for the second request (headers already set above)
        var approveClient = CreateServiceClient();
        await approveClient.PatchAsync(approveUrl, approveContent);

        var payment = JsonSerializer.Deserialize<List<JsonElement>>(paymentBody);
        return Ok(new
        {
            message = "Receipt uploaded and registrations approved.",
            payment = payment?[0]
        });
    }

    // ─────────────────────────────────────────────
    // TEAMS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/clubs/teams — optionally filter by ?tournament_id=xxx</summary>
    [HttpGet("teams")]
    public async Task<IActionResult> GetTeams([FromQuery] string? tournament_id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var filter = tournament_id != null ? $"&tournament_id=eq.{tournament_id}" : "";
        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/teams?club_id=eq.{clubId}{filter}&select=*&order=created_at.desc";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    /// <summary>POST /api/clubs/teams — create a team</summary>
    [HttpPost("teams")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var payload = new
        {
            club_id = clubId,
            tournament_id = request.TournamentId,
            competition_category_id = request.CompetitionCategoryId,
            competition_type = request.CompetitionType,
            team_name = request.TeamName
        };

        var client = CreateServiceClient();
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{SupabaseUrl}/rest/v1/teams", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }

    /// <summary>GET /api/clubs/teams/{id}/members</summary>
    [HttpGet("teams/{id}/members")]
    public async Task<IActionResult> GetTeamMembers(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        // Verify team belongs to this club
        var client = CreateServiceClient();
        var checkUrl = $"{SupabaseUrl}/rest/v1/teams?id=eq.{id}&club_id=eq.{clubId}&select=id&limit=1";
        var checkResponse = await client.GetAsync(checkUrl);
        var checkBody = await checkResponse.Content.ReadAsStringAsync();
        var teams = JsonSerializer.Deserialize<List<JsonElement>>(checkBody);
        if (teams == null || teams.Count == 0)
            return NotFound(new { error = "Team not found." });

        var url = $"{SupabaseUrl}/rest/v1/team_members?team_id=eq.{id}&select=*&order=created_at.asc";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    /// <summary>POST /api/clubs/teams/{id}/members — assign player (via registration_id) to team</summary>
    [HttpPost("teams/{id}/members")]
    public async Task<IActionResult> AddTeamMember(string id, [FromBody] AddTeamMemberRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var client = CreateServiceClient();

        // Verify team belongs to this club
        var teamUrl = $"{SupabaseUrl}/rest/v1/teams?id=eq.{id}&club_id=eq.{clubId}&select=id&limit=1";
        var teamResponse = await client.GetAsync(teamUrl);
        var teamBody = await teamResponse.Content.ReadAsStringAsync();
        var teams = JsonSerializer.Deserialize<List<JsonElement>>(teamBody);
        if (teams == null || teams.Count == 0)
            return NotFound(new { error = "Team not found." });

        // Verify registration belongs to this club
        var regUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{request.RegistrationId}&club_id=eq.{clubId}&select=id&limit=1";
        var regResponse = await client.GetAsync(regUrl);
        var regBody = await regResponse.Content.ReadAsStringAsync();
        var regs = JsonSerializer.Deserialize<List<JsonElement>>(regBody);
        if (regs == null || regs.Count == 0)
            return NotFound(new { error = "Registration not found or does not belong to this club." });

        var payload = new { team_id = id, registration_id = request.RegistrationId };
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{SupabaseUrl}/rest/v1/team_members", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }

    /// <summary>DELETE /api/clubs/teams/{id}/members/{registrationId} — remove player from team</summary>
    [HttpDelete("teams/{id}/members/{registrationId}")]
    public async Task<IActionResult> RemoveTeamMember(string id, string registrationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var clubId = await GetClubIdAsync(userId);
        if (clubId == null) return NotFound(new { error = "Club profile not found." });

        var client = CreateServiceClient();

        // Verify team belongs to this club
        var teamUrl = $"{SupabaseUrl}/rest/v1/teams?id=eq.{id}&club_id=eq.{clubId}&select=id&limit=1";
        var teamResponse = await client.GetAsync(teamUrl);
        var teamBody = await teamResponse.Content.ReadAsStringAsync();
        var teams = JsonSerializer.Deserialize<List<JsonElement>>(teamBody);
        if (teams == null || teams.Count == 0)
            return NotFound(new { error = "Team not found." });

        var url = $"{SupabaseUrl}/rest/v1/team_members?team_id=eq.{id}&registration_id=eq.{registrationId}";
        var response = await client.DeleteAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, new { error = body });
        }

        return NoContent();
    }
}

// ─────────────────────────────────────────────
// REQUEST MODELS
// ─────────────────────────────────────────────

public record UpdateClubProfileRequest(
    string? Name,
    string? ContactEmail,
    string? ContactPhone
);

public record RejectRegistrationRequest(string Reason);

public record CreateTeamRequest(
    string TournamentId,
    string CompetitionCategoryId,
    string CompetitionType,
    string TeamName
);

public record AddTeamMemberRequest(string RegistrationId);