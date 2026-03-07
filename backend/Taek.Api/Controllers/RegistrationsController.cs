using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Taek.Api.Attributes;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/registrations")]
public class RegistrationsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public RegistrationsController(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private HttpClient CreateServiceClient()
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", ServiceKey);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", ServiceKey);
        return client;
    }

    private string? GetUserId() => User.FindFirstValue("sub")
        ?? User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);

    private string? GetRole() =>
        User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .FirstOrDefault(r => r is "individual" or "parent" or "club");

    // ─────────────────────────────────────────────
    // POST /api/registrations — player registers
    // ─────────────────────────────────────────────

    /// <summary>
    /// POST /api/registrations — register a player for a competition category
    /// Allowed roles: individual, parent, club
    /// </summary>
    [HttpPost]
    [AuthorizeRole("individual", "parent", "club")]
    public async Task<IActionResult> Register([FromBody] CreateRegistrationRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var client = CreateServiceClient();

        // --- Step 1: Verify player exists and belongs to current user ---
        var playerUrl = $"{SupabaseUrl}/rest/v1/players?id=eq.{request.PlayerId}&user_id=eq.{userId}&select=*&limit=1";
        var playerResp = await client.GetAsync(playerUrl);
        var playerBody = await playerResp.Content.ReadAsStringAsync();
        var playerRows = JsonSerializer.Deserialize<List<JsonElement>>(playerBody);

        if (playerRows == null || playerRows.Count == 0)
            return NotFound(new { error = "Player not found or does not belong to you." });

        var player = playerRows[0];

        // --- Step 2: Verify player has a club ---
        var clubId = player.TryGetProperty("club_id", out var clubProp)
            ? clubProp.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(clubId))
            return BadRequest(new { error = "Player must be assigned to a club before registering." });

        // --- Step 3: Verify tournament exists and registration is open ---
        var tournamentUrl = $"{SupabaseUrl}/rest/v1/tournaments?id=eq.{request.TournamentId}&select=*&limit=1";
        var tournamentResp = await client.GetAsync(tournamentUrl);
        var tournamentBody = await tournamentResp.Content.ReadAsStringAsync();
        var tournamentRows = JsonSerializer.Deserialize<List<JsonElement>>(tournamentBody);

        if (tournamentRows == null || tournamentRows.Count == 0)
            return NotFound(new { error = "Tournament not found." });

        var tournament = tournamentRows[0];
        var now = DateTime.UtcNow;

        var registrationOpen = tournament.TryGetProperty("registration_open", out var roProp)
            ? roProp.GetDateTime()
            : (DateTime?)null;

        var registrationClose = tournament.TryGetProperty("registration_close", out var rcProp)
            ? rcProp.GetDateTime()
            : (DateTime?)null;

        if (registrationOpen == null || registrationClose == null)
            return BadRequest(new { error = "Tournament registration dates not set." });

        if (now < registrationOpen)
            return BadRequest(new { error = "Tournament registration has not opened yet." });

        if (now > registrationClose)
            return BadRequest(new { error = "Tournament registration has closed." });

        // --- Step 4: Verify competition category exists ---
        var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };
        if (!validTypes.Contains(request.CompetitionType))
            return BadRequest(new { error = "Invalid competition type." });

        var categoryTable = $"{request.CompetitionType}_categories";
        var categoryUrl = $"{SupabaseUrl}/rest/v1/{categoryTable}?id=eq.{request.CompetitionCategoryId}&select=id,fee_amount&limit=1";
        var categoryResp = await client.GetAsync(categoryUrl);
        var categoryBody = await categoryResp.Content.ReadAsStringAsync();
        var categoryRows = JsonSerializer.Deserialize<List<JsonElement>>(categoryBody);

        if (categoryRows == null || categoryRows.Count == 0)
            return NotFound(new { error = "Competition category not found." });

        // --- Step 5: Check for duplicate registration ---
        var dupUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations" +
                     $"?tournament_id=eq.{request.TournamentId}" +
                     $"&player_id=eq.{request.PlayerId}" +
                     $"&competition_category_id=eq.{request.CompetitionCategoryId}" +
                     $"&status=neq.rejected" +
                     $"&select=id&limit=1";
        var dupResp = await client.GetAsync(dupUrl);
        var dupBody = await dupResp.Content.ReadAsStringAsync();
        var dupRows = JsonSerializer.Deserialize<List<JsonElement>>(dupBody);

        if (dupRows != null && dupRows.Count > 0)
            return Conflict(new { error = "Player is already registered for this competition category." });

        // --- Step 6: Insert registration ---
        var payload = new
        {
            tournament_id = request.TournamentId,
            player_id = request.PlayerId,
            competition_category_id = request.CompetitionCategoryId,
            competition_type = request.CompetitionType,
            club_id = clubId,
            status = "pending"
        };

        var regClient = CreateServiceClient();
        regClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await regClient.PostAsync($"{SupabaseUrl}/rest/v1/tournament_registrations", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(rows?[0]);
    }

    // ─────────────────────────────────────────────
    // GET /api/registrations — player views history
    // ─────────────────────────────────────────────

    /// <summary>
    /// GET /api/registrations — view all registrations for current user's players
    /// Optional filter: ?tournament_id=xxx, ?player_id=xxx, ?status=xxx
    /// </summary>
    [HttpGet]
    [AuthorizeRole("individual", "parent", "club")]
    public async Task<IActionResult> GetRegistrations(
        [FromQuery] string? tournament_id,
        [FromQuery] string? player_id,
        [FromQuery] string? status)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var client = CreateServiceClient();

        // Get all players belonging to this user
        var playersUrl = $"{SupabaseUrl}/rest/v1/players?user_id=eq.{userId}&select=id";
        var playersResp = await client.GetAsync(playersUrl);
        var playersBody = await playersResp.Content.ReadAsStringAsync();
        var playerRows = JsonSerializer.Deserialize<List<JsonElement>>(playersBody);

        if (playerRows == null || playerRows.Count == 0)
            return Ok(new List<object>());

        // Build player ID filter
        var playerIds = playerRows
            .Select(p => p.GetProperty("id").GetString())
            .Where(id => id != null)
            .ToList();

        // If specific player_id requested, validate it belongs to user
        if (!string.IsNullOrWhiteSpace(player_id) && !playerIds.Contains(player_id))
            return Forbid();

        var idFilter = string.IsNullOrWhiteSpace(player_id)
            ? $"player_id=in.({string.Join(",", playerIds)})"
            : $"player_id=eq.{player_id}";

        var filters = $"&{idFilter}";
        if (!string.IsNullOrWhiteSpace(tournament_id)) filters += $"&tournament_id=eq.{tournament_id}";
        if (!string.IsNullOrWhiteSpace(status)) filters += $"&status=eq.{status}";

        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations" +
                  $"?select=*,players(id,full_name,age_group,weight_class,belt_rank_id)," +
                  $"tournaments(id,title,start_date,end_date,image)" +
                  $"{filters}" +
                  $"&order=created_at.desc";

        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    // ─────────────────────────────────────────────
    // DELETE /api/registrations/{id} — cancel registration
    // ─────────────────────────────────────────────

    /// <summary>
    /// DELETE /api/registrations/{id} — cancel registration (pending only)
    /// </summary>
    [HttpDelete("{id}")]
    [AuthorizeRole("individual", "parent", "club")]
    public async Task<IActionResult> CancelRegistration(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var client = CreateServiceClient();

        // Fetch registration
        var regUrl = $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}&select=*&limit=1";
        var regResp = await client.GetAsync(regUrl);
        var regBody = await regResp.Content.ReadAsStringAsync();
        var regRows = JsonSerializer.Deserialize<List<JsonElement>>(regBody);

        if (regRows == null || regRows.Count == 0)
            return NotFound(new { error = "Registration not found." });

        var reg = regRows[0];

        // Verify player belongs to current user
        var playerId = reg.TryGetProperty("player_id", out var pidProp)
            ? pidProp.GetString()
            : null;

        var playerUrl = $"{SupabaseUrl}/rest/v1/players?id=eq.{playerId}&user_id=eq.{userId}&select=id&limit=1";
        var playerResp = await client.GetAsync(playerUrl);
        var playerBody = await playerResp.Content.ReadAsStringAsync();
        var playerRows = JsonSerializer.Deserialize<List<JsonElement>>(playerBody);

        if (playerRows == null || playerRows.Count == 0)
            return Forbid();

        // Only allow cancel if pending
        var currentStatus = reg.TryGetProperty("status", out var statusProp)
            ? statusProp.GetString()
            : null;

        if (currentStatus != "pending")
            return BadRequest(new { error = $"Cannot cancel a registration with status '{currentStatus}'. Only 'pending' registrations can be cancelled." });

        // Delete registration
        var deleteResp = await client.DeleteAsync(
            $"{SupabaseUrl}/rest/v1/tournament_registrations?id=eq.{id}");

        if (!deleteResp.IsSuccessStatusCode)
        {
            var errBody = await deleteResp.Content.ReadAsStringAsync();
            return StatusCode((int)deleteResp.StatusCode, new { error = errBody });
        }

        return NoContent();
    }
}

// ─────────────────────────────────────────────
// REQUEST MODELS
// ─────────────────────────────────────────────

public record CreateRegistrationRequest(
    string PlayerId,
    string TournamentId,
    string CompetitionCategoryId,
    string CompetitionType
);