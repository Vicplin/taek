using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Taek.Api.Attributes;
using Taek.Api.Services;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/tournaments")]
public class TournamentsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly SupabaseStorageService _storage;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public TournamentsController(IHttpClientFactory httpClientFactory, IConfiguration config, SupabaseStorageService storage)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _storage = storage;
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

    private async Task<string?> GetOrganiserIdAsync(string userId)
    {
        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/organiser_profiles?user_id=eq.{userId}&select=id&limit=1";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();
        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        if (rows == null || rows.Count == 0) return null;
        return userId; // profile exists, return userId for use as organiser_id
    }

    private static string CalculateStatus(
        DateTime? registrationOpen,
        DateTime? registrationClose,
        DateTime? startDate,
        DateTime? endDate,
        string currentStatus)
    {
        if (currentStatus == "cancelled") return "cancelled";
        var now = DateTime.UtcNow;
        if (endDate.HasValue && now > endDate.Value) return "completed";
        if (startDate.HasValue && now >= startDate.Value) return "ongoing";
        if (registrationClose.HasValue && now >= registrationClose.Value) return "registration_closed";
        if (registrationOpen.HasValue && now >= registrationOpen.Value) return "registration_open";
        return "upcoming";
    }

    private static string GetStatus(JsonElement t)
    {
        return CalculateStatus(
            t.TryGetProperty("registration_open", out var ro) && ro.ValueKind != JsonValueKind.Null ? ro.GetDateTime() : null,
            t.TryGetProperty("registration_close", out var rc) && rc.ValueKind != JsonValueKind.Null ? rc.GetDateTime() : null,
            t.TryGetProperty("start_date", out var sd) && sd.ValueKind != JsonValueKind.Null ? sd.GetDateTime() : null,
            t.TryGetProperty("end_date", out var ed) && ed.ValueKind != JsonValueKind.Null ? ed.GetDateTime() : null,
            t.TryGetProperty("status", out var st) ? st.GetString() ?? "upcoming" : "upcoming"
        );
    }

    private async Task<JsonElement?> GetTournamentForOrganiserAsync(HttpClient client, string tournamentId, string organiserId)
    {
        var url = $"{SupabaseUrl}/rest/v1/tournaments?id=eq.{tournamentId}&organiser_id=eq.{organiserId}&select=*&limit=1";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();
        var rows = JsonSerializer.Deserialize<List<JsonElement>>(body);
        if (rows == null || rows.Count == 0) return null;
        return rows[0];
    }

    private async Task<string?> UploadFileAsync(string organiserId, string prefix, string? ext, IFormFile file, CancellationToken ct)
    {
        var path = $"tournaments/{organiserId}/{prefix}-{Guid.NewGuid():N}{ext ?? Path.GetExtension(file.FileName)}";
        return await _storage.UploadAsync("tournament-assets", path, file, ct);
    }

    private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/png", "image/webp" };
    private static readonly string[] AllowedImageExts = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedPdfTypes = { "application/pdf" };
    private static readonly string[] AllowedPdfExts = { ".pdf" };

    private static bool IsValidImage(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        return AllowedImageTypes.Contains(file.ContentType.ToLowerInvariant()) && AllowedImageExts.Contains(ext);
    }

    private static bool IsValidPdf(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        return AllowedPdfTypes.Contains(file.ContentType.ToLowerInvariant()) && AllowedPdfExts.Contains(ext);
    }

    // ─────────────────────────────────────────────
    // PUBLIC ENDPOINTS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/tournaments — public list of all tournaments</summary>
    [HttpGet]
    public async Task<IActionResult> GetTournaments()
    {
        try
        {
            var client = CreateServiceClient();
            var url = $"{SupabaseUrl}/rest/v1/tournaments?select=*&order=start_date.asc";
            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = body });

            var tournaments = JsonSerializer.Deserialize<List<JsonElement>>(body);
            if (tournaments == null) return Ok(new List<object>());

            var result = tournaments.Select(t => new { tournament = t, computed_status = GetStatus(t) }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/tournaments/{id} — public single tournament with documents</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTournament(string id)
    {
        try
        {
            var client = CreateServiceClient();

            var tUrl = $"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}&select=*&limit=1";
            var tResponse = await client.GetAsync(tUrl);
            var tBody = await tResponse.Content.ReadAsStringAsync();
            var rows = JsonSerializer.Deserialize<List<JsonElement>>(tBody);

            if (rows == null || rows.Count == 0)
                return NotFound(new { error = "Tournament not found." });

            var t = rows[0];

            var docsUrl = $"{SupabaseUrl}/rest/v1/tournament_documents?tournament_id=eq.{id}&select=*&order=created_at.asc";
            var docsResponse = await client.GetAsync(docsUrl);
            var docsBody = await docsResponse.Content.ReadAsStringAsync();
            var docs = JsonSerializer.Deserialize<object>(docsBody);

            return Ok(new { tournament = t, computed_status = GetStatus(t), other_documents = docs });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // ORGANISER ENDPOINTS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/tournaments/mine — organiser views their own tournaments</summary>
    [HttpGet("mine")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> GetMyTournaments()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var url = $"{SupabaseUrl}/rest/v1/tournaments?organiser_id=eq.{organiserId}&select=*&order=start_date.asc";
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    /// <summary>
    /// POST /api/tournaments — Step 1: create tournament with basic info + banner
    /// multipart/form-data: Title, Description, VenueDetails, Address, StateId, CityId,
    ///   GoogleMapsLink, StartDate, EndDate, RegistrationOpen, RegistrationClose, MaxParticipants
    ///   + banner (image, optional)
    /// Returns: tournament with id — use id for next steps
    /// </summary>
    [HttpPost]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> CreateTournament(
        [FromForm] CreateTournamentRequest request,
        IFormFile? banner,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found. Create your profile first." });

        // Validate file types
        if (banner != null && !IsValidImage(banner))
            return BadRequest(new { error = "Banner must be an image (jpg, png, webp)." });

        string? bannerUrl = null;
        if (banner != null)
        {
            try { bannerUrl = await UploadFileAsync(organiserId, "banner", null, banner, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Banner upload failed: {ex.Message}" }); }
        }

        var payload = new
        {
            organiser_id = organiserId,
            title = request.Title,
            description = request.Description,
            venue_details = request.VenueDetails,
            address = request.Address,
            state_id = request.StateId,
            city_id = request.CityId,
            google_maps_link = string.IsNullOrWhiteSpace(request.GoogleMapsLink) ? null : request.GoogleMapsLink,
            start_date = request.StartDate,
            end_date = request.EndDate,
            registration_open = request.RegistrationOpen,
            registration_close = request.RegistrationClose,
            max_participants = request.MaxParticipants,
            image = bannerUrl,
            status = "upcoming"
        };

        var client = CreateServiceClient();
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{SupabaseUrl}/rest/v1/tournaments", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var created = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(created?[0]);
    }

    /// <summary>
    /// POST /api/tournaments/{id}/categories — Step 2: add all tournament categories + competition categories
    /// Body (JSON):
    /// [
    ///   {
    ///     "type": "kyorugi",
    ///     "competition_categories": [
    ///       {
    ///         "name": "Senior Welter",
    ///         "age_group_ids": ["uuid1", "uuid2"],
    ///         "gender_ids": ["uuid1"],
    ///         "belt_rank_from_id": "uuid",
    ///         "belt_rank_to_id": "uuid",
    ///         "division_id": null,
    ///         "is_team": false,
    ///         "team_size": null,
    ///         "fee_amount": 50.00
    ///       }
    ///     ]
    ///   }
    /// ]
    /// </summary>
    [HttpPost("{id}/categories")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> AddCategories(string id, [FromBody] List<TournamentCategoryInput> categories)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Categories can only be added when tournament status is 'upcoming'." });

        var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };
        var categoryResults = new List<object>();

        foreach (var cat in categories)
        {
            if (!validTypes.Contains(cat.Type)) continue;

            // Insert tournament_category
            var catPayload = new { tournament_id = id, type = cat.Type };
            var catClient = CreateServiceClient();
            catClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
            var catContent = new StringContent(JsonSerializer.Serialize(catPayload), Encoding.UTF8, "application/json");
            var catResponse = await catClient.PostAsync($"{SupabaseUrl}/rest/v1/tournament_categories", catContent);
            var catBody = await catResponse.Content.ReadAsStringAsync();
            if (!catResponse.IsSuccessStatusCode) continue;

            var catRows = JsonSerializer.Deserialize<List<JsonElement>>(catBody);
            var tournamentCategoryId = catRows?[0].GetProperty("id").GetString();
            if (tournamentCategoryId == null) continue;

            var table = $"{cat.Type}_categories";
            var prefix = $"{cat.Type}_category";
            var fkColumn = $"{prefix}_id";
            var ageGroupJunctionTable = $"{prefix}_age_groups";
            var genderJunctionTable = $"{prefix}_genders";

            var competitionResults = new List<object>();
            foreach (var cc in cat.CompetitionCategories ?? new List<CompetitionCategoryInput>())
            {
                static string? NullIfEmpty(string? v) => string.IsNullOrWhiteSpace(v) ? null : v;
                var ccPayload = new Dictionary<string, object?>
                {
                    ["tournament_category_id"] = tournamentCategoryId,
                    ["name"] = cc.Name,
                    ["belt_rank_from_id"] = NullIfEmpty(cc.BeltRankFromId),
                    ["belt_rank_to_id"] = NullIfEmpty(cc.BeltRankToId),
                    ["is_team"] = cc.IsTeam,
                    ["team_size"] = cc.TeamSize,
                    ["fee_amount"] = cc.FeeAmount
                };

                if (cat.Type == "kyorugi")
                    ccPayload["division_id"] = NullIfEmpty(cc.DivisionId);

                if (cat.Type == "speed_kicking")
                    ccPayload["kick_type"] = NullIfEmpty(cc.KickType);

                if (cat.Type == "breaking")
                    ccPayload["break_type"] = NullIfEmpty(cc.BreakType);

                if (cat.Type == "freestyle")
                    ccPayload["freestyle_type"] = NullIfEmpty(cc.FreestyleType);

                var ccClient = CreateServiceClient();
                ccClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
                var ccContent = new StringContent(JsonSerializer.Serialize(ccPayload), Encoding.UTF8, "application/json");
                var ccResponse = await ccClient.PostAsync($"{SupabaseUrl}/rest/v1/{table}", ccContent);
                var ccBody = await ccResponse.Content.ReadAsStringAsync();
                if (!ccResponse.IsSuccessStatusCode) { competitionResults.Add(new { error = ccBody }); continue; }

                var ccRows = JsonSerializer.Deserialize<List<JsonElement>>(ccBody);
                var ccId = ccRows?[0].GetProperty("id").GetString();
                if (ccId == null) continue;

                foreach (var agId in cc.AgeGroupIds ?? new List<string>())
                {
                    var jp = new Dictionary<string, object?> { [fkColumn] = ccId, ["age_group_id"] = agId };
                    var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                    await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{ageGroupJunctionTable}", jc);
                }

                foreach (var gId in cc.GenderIds ?? new List<string>())
                {
                    var jp = new Dictionary<string, object?> { [fkColumn] = ccId, ["gender_id"] = gId };
                    var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                    await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{genderJunctionTable}", jc);
                }

                competitionResults.Add(new { category = ccRows?[0], age_group_ids = cc.AgeGroupIds, gender_ids = cc.GenderIds });
            }

            categoryResults.Add(new { type = cat.Type, tournament_category_id = tournamentCategoryId, competition_categories = competitionResults });
        }

        return Ok(new { tournament_id = id, categories = categoryResults });
    }

    /// <summary>
    /// PUT /api/tournaments/{id}/categories — replace all categories (upcoming only)
    /// Deletes existing tournament_categories and re-inserts from scratch.
    /// </summary>
    [HttpPut("{id}/categories")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> UpdateCategories(string id, [FromBody] List<TournamentCategoryInput> categories)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Categories can only be edited when tournament status is 'upcoming'." });

        // --- Step 1: fetch existing tournament_categories to get their IDs ---
        var fetchResponse = await client.GetAsync(
            $"{SupabaseUrl}/rest/v1/tournament_categories?tournament_id=eq.{id}&select=id,type");
        var fetchBody = await fetchResponse.Content.ReadAsStringAsync();
        var existingCats = JsonSerializer.Deserialize<List<JsonElement>>(fetchBody) ?? new();

        // --- Step 2: delete type-specific rows first (in case no DB cascade) ---
        var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };

        foreach (var ec in existingCats)
        {
            var tcId = ec.GetProperty("id").GetString();
            var tcType = ec.GetProperty("type").GetString();
            if (tcId == null || tcType == null || !validTypes.Contains(tcType)) continue;

            var typeTable = $"{tcType}_categories";
            var fkCol = $"{tcType}_category_id";

            // Fetch competition category IDs for this tournament_category
            var ccFetchResp = await CreateServiceClient().GetAsync(
                $"{SupabaseUrl}/rest/v1/{typeTable}?tournament_category_id=eq.{tcId}&select=id");
            var ccFetchBody = await ccFetchResp.Content.ReadAsStringAsync();
            var ccRows = JsonSerializer.Deserialize<List<JsonElement>>(ccFetchBody) ?? new();

            // Delete junction rows first
            foreach (var ccRow in ccRows)
            {
                var ccId = ccRow.GetProperty("id").GetString();
                if (ccId == null) continue;

                await CreateServiceClient().DeleteAsync(
                    $"{SupabaseUrl}/rest/v1/{tcType}_category_age_groups?{fkCol}=eq.{ccId}");
                await CreateServiceClient().DeleteAsync(
                    $"{SupabaseUrl}/rest/v1/{tcType}_category_genders?{fkCol}=eq.{ccId}");
            }

            // Delete competition category rows
            await CreateServiceClient().DeleteAsync(
                $"{SupabaseUrl}/rest/v1/{typeTable}?tournament_category_id=eq.{tcId}");
        }

        // --- Step 3: delete tournament_categories rows ---
        await client.DeleteAsync(
            $"{SupabaseUrl}/rest/v1/tournament_categories?tournament_id=eq.{id}");

        // --- Step 4: re-insert (same logic as AddCategories) ---
        var categoryResults = new List<object>();

        foreach (var cat in categories)
        {
            if (!validTypes.Contains(cat.Type)) continue;

            var catPayload = new { tournament_id = id, type = cat.Type };
            var catClient = CreateServiceClient();
            catClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
            var catContent = new StringContent(JsonSerializer.Serialize(catPayload), Encoding.UTF8, "application/json");
            var catResponse = await catClient.PostAsync($"{SupabaseUrl}/rest/v1/tournament_categories", catContent);
            var catBody = await catResponse.Content.ReadAsStringAsync();
            if (!catResponse.IsSuccessStatusCode) continue;

            var catRows = JsonSerializer.Deserialize<List<JsonElement>>(catBody);
            var tournamentCategoryId = catRows?[0].GetProperty("id").GetString();
            if (tournamentCategoryId == null) continue;

            var table = $"{cat.Type}_categories";
            var prefix = $"{cat.Type}_category";
            var fkColumn = $"{prefix}_id";
            var ageGroupJunctionTable = $"{prefix}_age_groups";
            var genderJunctionTable = $"{prefix}_genders";

            var competitionResults = new List<object>();
            foreach (var cc in cat.CompetitionCategories ?? new List<CompetitionCategoryInput>())
            {
                static string? NullIfEmpty(string? v) => string.IsNullOrWhiteSpace(v) ? null : v;
                var ccPayload = new Dictionary<string, object?>
                {
                    ["tournament_category_id"] = tournamentCategoryId,
                    ["name"] = cc.Name,
                    ["belt_rank_from_id"] = NullIfEmpty(cc.BeltRankFromId),
                    ["belt_rank_to_id"] = NullIfEmpty(cc.BeltRankToId),
                    ["is_team"] = cc.IsTeam,
                    ["team_size"] = cc.TeamSize,
                    ["fee_amount"] = cc.FeeAmount
                };

                if (cat.Type == "kyorugi")
                    ccPayload["division_id"] = NullIfEmpty(cc.DivisionId);

                if (cat.Type == "speed_kicking")
                    ccPayload["kick_type"] = NullIfEmpty(cc.KickType);

                if (cat.Type == "breaking")
                    ccPayload["break_type"] = NullIfEmpty(cc.BreakType);

                if (cat.Type == "freestyle")
                    ccPayload["freestyle_type"] = NullIfEmpty(cc.FreestyleType);

                var ccClient = CreateServiceClient();
                ccClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
                var ccContent = new StringContent(JsonSerializer.Serialize(ccPayload), Encoding.UTF8, "application/json");
                var ccResponse = await ccClient.PostAsync($"{SupabaseUrl}/rest/v1/{table}", ccContent);
                var ccBody = await ccResponse.Content.ReadAsStringAsync();
                if (!ccResponse.IsSuccessStatusCode) { competitionResults.Add(new { error = ccBody }); continue; }

                var ccRows2 = JsonSerializer.Deserialize<List<JsonElement>>(ccBody);
                var ccId2 = ccRows2?[0].GetProperty("id").GetString();
                if (ccId2 == null) continue;

                foreach (var agId in cc.AgeGroupIds ?? new List<string>())
                {
                    var jp = new Dictionary<string, object?> { [fkColumn] = ccId2, ["age_group_id"] = agId };
                    var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                    await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{ageGroupJunctionTable}", jc);
                }

                foreach (var gId in cc.GenderIds ?? new List<string>())
                {
                    var jp = new Dictionary<string, object?> { [fkColumn] = ccId2, ["gender_id"] = gId };
                    var jc = new StringContent(JsonSerializer.Serialize(jp), Encoding.UTF8, "application/json");
                    await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/{genderJunctionTable}", jc);
                }

                competitionResults.Add(new { category = ccRows2?[0], age_group_ids = cc.AgeGroupIds, gender_ids = cc.GenderIds });
            }

            categoryResults.Add(new { type = cat.Type, tournament_category_id = tournamentCategoryId, competition_categories = competitionResults });
        }

        return Ok(new { tournament_id = id, categories = categoryResults });
    }

    /// <summary>
    /// PUT /api/tournaments/{tournamentId}/categories/{competitionType}/{competitionCategoryId}/bracket
    /// Upload bracket PDF for a specific competition category (upcoming/ongoing tournaments only)
    /// </summary>
    [HttpPut("{tournamentId}/categories/{competitionType}/{competitionCategoryId}/bracket")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> UploadBracket(
        string tournamentId,
        string competitionType,
        string competitionCategoryId,
        IFormFile? bracket,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, tournamentId, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };
        if (!validTypes.Contains(competitionType))
            return BadRequest(new { error = "Invalid competition type." });

        if (bracket == null)
            return BadRequest(new { error = "Bracket file is required." });

        if (!IsValidPdf(bracket))
            return BadRequest(new { error = "Bracket must be a PDF file." });

        // Upload to Supabase Storage
        string bracketUrl;
        try
        {
            bracketUrl = await UploadFileAsync(organiserId, $"bracket-{competitionType}", ".pdf", bracket, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = $"Bracket upload failed: {ex.Message}" });
        }

        // Patch bracket_url on the correct category table
        var table = $"{competitionType}_categories";
        var patchPayload = new Dictionary<string, object?> { ["bracket_url"] = bracketUrl };
        var patchContent = new StringContent(JsonSerializer.Serialize(patchPayload), Encoding.UTF8, "application/json");

        var patchClient = CreateServiceClient();
        patchClient.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var patchResponse = await patchClient.PatchAsync(
            $"{SupabaseUrl}/rest/v1/{table}?id=eq.{competitionCategoryId}", patchContent);

        if (!patchResponse.IsSuccessStatusCode)
        {
            var patchBody = await patchResponse.Content.ReadAsStringAsync();
            return StatusCode((int)patchResponse.StatusCode, new { error = patchBody });
        }

        return NoContent();
    }

    /// <summary>
    /// POST /api/tournaments/{id}/documents — Step 3: upload documents
    /// multipart/form-data: bundle (PDF), other (PDF optional), schedule (image optional)
    /// </summary>
    [HttpPost("{id}/documents")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> UploadDocuments(
        string id,
        IFormFile? bundle,
        IFormFile? other,
        IFormFile? schedule,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Documents can only be uploaded when tournament status is 'upcoming'." });

        // Validate file types
        if (bundle != null && !IsValidPdf(bundle))
            return BadRequest(new { error = "Bundle must be a PDF file." });
        if (other != null && !IsValidPdf(other))
            return BadRequest(new { error = "Other document must be a PDF file." });
        if (schedule != null && !IsValidImage(schedule))
            return BadRequest(new { error = "Schedule must be an image (jpg, png, webp)." });

        string? bundleUrl = null;
        if (bundle != null)
        {
            try { bundleUrl = await UploadFileAsync(organiserId, "bundle", ".pdf", bundle, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Bundle upload failed: {ex.Message}" }); }
        }

        string? scheduleUrl = null;
        if (schedule != null)
        {
            try { scheduleUrl = await UploadFileAsync(organiserId, "schedule", null, schedule, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Schedule upload failed: {ex.Message}" }); }
        }

        // Update tournament with bundle and schedule urls
        var patchPayload = new Dictionary<string, object?>();
        if (bundleUrl != null) patchPayload["tournament_bundle_url"] = bundleUrl;
        if (scheduleUrl != null) patchPayload["schedule_url"] = scheduleUrl;
        if (patchPayload.Count > 0)
        {
            patchPayload["updated_at"] = DateTime.UtcNow;
            var patchContent = new StringContent(JsonSerializer.Serialize(patchPayload), Encoding.UTF8, "application/json");
            var patchClient = CreateServiceClient();
            await patchClient.PatchAsync($"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}", patchContent);
        }

        // Upload "other" document into tournament_documents table
        string? otherUrl = null;
        if (other != null)
        {
            try
            {
                otherUrl = await UploadFileAsync(organiserId, "other", ".pdf", other, cancellationToken);
                var docPayload = new { tournament_id = id, url = otherUrl, file_name = other.FileName };
                var docContent = new StringContent(JsonSerializer.Serialize(docPayload), Encoding.UTF8, "application/json");
                await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/tournament_documents", docContent);
            }
            catch { /* non-fatal */ }
        }

        return Ok(new { tournament_id = id, bundle_url = bundleUrl, schedule_url = scheduleUrl, other_url = otherUrl });
    }

    /// <summary>
    /// PUT /api/tournaments/{id}/documents — replace tournament documents (upcoming only)
    /// multipart/form-data: bundle (PDF), schedule (image), other (PDF, appended)
    /// </summary>
    [HttpPut("{id}/documents")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> UpdateDocuments(
        string id,
        IFormFile? bundle,
        IFormFile? schedule,
        IFormFile? other,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Documents can only be edited when tournament status is 'upcoming'." });

        if (bundle == null && schedule == null && other == null)
            return BadRequest(new { error = "At least one file must be provided." });

        // Validate
        if (bundle != null && !IsValidPdf(bundle))
            return BadRequest(new { error = "Bundle must be a PDF file." });
        if (schedule != null && !IsValidImage(schedule))
            return BadRequest(new { error = "Schedule must be an image (jpg, png, webp)." });
        if (other != null && !IsValidPdf(other))
            return BadRequest(new { error = "Other document must be a PDF file." });

        // Upload bundle / schedule and patch the tournament row
        var patchPayload = new Dictionary<string, object?>();

        if (bundle != null)
        {
            try
            {
                var url = await UploadFileAsync(organiserId, "bundle", ".pdf", bundle, cancellationToken);
                patchPayload["tournament_bundle_url"] = url;
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = $"Bundle upload failed: {ex.Message}" });
            }
        }

        if (schedule != null)
        {
            try
            {
                var url = await UploadFileAsync(organiserId, "schedule", null, schedule, cancellationToken);
                patchPayload["schedule_url"] = url;
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = $"Schedule upload failed: {ex.Message}" });
            }
        }

        if (patchPayload.Count > 0)
        {
            patchPayload["updated_at"] = DateTime.UtcNow;
            client.DefaultRequestHeaders.Add("Prefer", "return=representation");
            var patchContent = new StringContent(JsonSerializer.Serialize(patchPayload), Encoding.UTF8, "application/json");
            var patchResponse = await client.PatchAsync($"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}", patchContent);

            if (!patchResponse.IsSuccessStatusCode)
            {
                var patchBody = await patchResponse.Content.ReadAsStringAsync();
                return StatusCode((int)patchResponse.StatusCode, new { error = patchBody });
            }
        }

        // Append new "other" doc row (same as UpdateTournament)
        if (other != null)
        {
            try
            {
                var otherUrl = await UploadFileAsync(organiserId, "other", ".pdf", other, cancellationToken);
                var docPayload = new { tournament_id = id, url = otherUrl, file_name = other.FileName };
                var docContent = new StringContent(JsonSerializer.Serialize(docPayload), Encoding.UTF8, "application/json");
                await CreateServiceClient().PostAsync($"{SupabaseUrl}/rest/v1/tournament_documents", docContent);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = $"Other document upload failed: {ex.Message}" });
            }
        }

        return NoContent();
    }

        /// <summary>
    /// PUT /api/tournaments/{id} — edit tournament (upcoming only)
    /// multipart/form-data: same file fields as create, all optional
    /// </summary>
    [HttpPut("{id}")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> UpdateTournament(
        string id,
        [FromForm] UpdateTournamentRequest request,
        IFormFile? banner,
        IFormFile? bundle,
        IFormFile? other,
        IFormFile? schedule,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Tournament can only be edited when status is 'upcoming'." });

        // Validate file types
        if (banner != null && !IsValidImage(banner))
            return BadRequest(new { error = "Banner must be an image (jpg, png, webp)." });
        if (bundle != null && !IsValidPdf(bundle))
            return BadRequest(new { error = "Bundle must be a PDF file." });
        if (schedule != null && !IsValidImage(schedule))
            return BadRequest(new { error = "Schedule must be an image (jpg, png, webp)." });

        string? bannerUrl = null;
        if (banner != null)
        {
            try { bannerUrl = await UploadFileAsync(organiserId, "banner", null, banner, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Banner upload failed: {ex.Message}" }); }
        }

        string? bundleUrl = null;
        if (bundle != null)
        {
            try { bundleUrl = await UploadFileAsync(organiserId, "bundle", ".pdf", bundle, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Bundle upload failed: {ex.Message}" }); }
        }

        string? scheduleUrl = null;
        if (schedule != null)
        {
            try { scheduleUrl = await UploadFileAsync(organiserId, "schedule", null, schedule, cancellationToken); }
            catch (InvalidOperationException ex) { return BadRequest(new { error = $"Schedule upload failed: {ex.Message}" }); }
        }

        var patchPayload = new Dictionary<string, object?>();
        if (!string.IsNullOrWhiteSpace(request.Title)) patchPayload["title"] = request.Title;
        if (request.Description != null) patchPayload["description"] = request.Description;
        if (request.VenueDetails != null) patchPayload["venue_details"] = request.VenueDetails;
        if (request.Address != null) patchPayload["address"] = request.Address;
        if (request.StateId != null) patchPayload["state_id"] = request.StateId;
        if (request.CityId != null) patchPayload["city_id"] = request.CityId;
        if (request.GoogleMapsLink != null) patchPayload["google_maps_link"] = request.GoogleMapsLink;
        if (request.StartDate.HasValue) patchPayload["start_date"] = request.StartDate;
        if (request.EndDate.HasValue) patchPayload["end_date"] = request.EndDate;
        if (request.RegistrationOpen.HasValue) patchPayload["registration_open"] = request.RegistrationOpen;
        if (request.RegistrationClose.HasValue) patchPayload["registration_close"] = request.RegistrationClose;
        if (request.MaxParticipants.HasValue) patchPayload["max_participants"] = request.MaxParticipants;
        if (bannerUrl != null) patchPayload["image"] = bannerUrl;
        if (bundleUrl != null) patchPayload["tournament_bundle_url"] = bundleUrl;
        if (scheduleUrl != null) patchPayload["schedule_url"] = scheduleUrl;
        patchPayload["updated_at"] = DateTime.UtcNow;

        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var patchContent = new StringContent(JsonSerializer.Serialize(patchPayload), Encoding.UTF8, "application/json");
        var patchResponse = await client.PatchAsync($"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}", patchContent);
        var patchBody = await patchResponse.Content.ReadAsStringAsync();

        if (!patchResponse.IsSuccessStatusCode)
            return StatusCode((int)patchResponse.StatusCode, new { error = patchBody });

        // Upload new "other" document if provided
        if (other != null)
        {
            try
            {
                var otherUrl = await UploadFileAsync(organiserId, "other", ".pdf", other, cancellationToken);
                var docPayload = new { tournament_id = id, url = otherUrl, file_name = other.FileName };
                var docContent = new StringContent(JsonSerializer.Serialize(docPayload), Encoding.UTF8, "application/json");
                var docClient = CreateServiceClient();
                await docClient.PostAsync($"{SupabaseUrl}/rest/v1/tournament_documents", docContent);
            }
            catch { /* non-fatal */ }
        }

        var updated = JsonSerializer.Deserialize<List<JsonElement>>(patchBody);
        return Ok(updated?[0]);
    }

    /// <summary>DELETE /api/tournaments/{id}/documents/{docId} — remove an other document (upcoming only)</summary>
    [HttpDelete("{id}/documents/{docId}")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> DeleteDocument(string id, string docId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Documents can only be deleted when tournament status is 'upcoming'." });

        // Check existence
        var checkResp = await client.GetAsync(
            $"{SupabaseUrl}/rest/v1/tournament_documents?id=eq.{docId}&tournament_id=eq.{id}&select=id&limit=1");
        var checkBody = await checkResp.Content.ReadAsStringAsync();

        List<JsonElement>? checkRows = null;
        try { checkRows = JsonSerializer.Deserialize<List<JsonElement>>(checkBody); }
        catch { checkRows = null; }

        if (checkRows == null || checkRows.Count == 0)
            return NotFound(new { error = "Document not found." });

        var deleteResponse = await client.DeleteAsync($"{SupabaseUrl}/rest/v1/tournament_documents?id=eq.{docId}&tournament_id=eq.{id}");

        if (!deleteResponse.IsSuccessStatusCode)
        {
            var body = await deleteResponse.Content.ReadAsStringAsync();
            return StatusCode((int)deleteResponse.StatusCode, new { error = body });
        }

        return NoContent();
    }

    /// <summary>PATCH /api/tournaments/{id}/cancel — cancel tournament (upcoming only)</summary>
    [HttpPatch("{id}/cancel")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> CancelTournament(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        if (GetStatus(existing.Value) != "upcoming")
            return BadRequest(new { error = "Tournament can only be cancelled when status is 'upcoming'." });

        var payload = new { status = "cancelled", updated_at = DateTime.UtcNow };
        client.DefaultRequestHeaders.Add("Prefer", "return=representation");
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PatchAsync($"{SupabaseUrl}/rest/v1/tournaments?id=eq.{id}", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var updated = JsonSerializer.Deserialize<List<JsonElement>>(body);
        return Ok(updated?[0]);
    }

    /// <summary>GET /api/tournaments/{id}/registrations — organiser views approved players grouped by competition category</summary>
    [HttpGet("{id}/registrations")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> GetTournamentRegistrations(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        // Fetch approved registrations with player + club info
        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations" +
                  $"?tournament_id=eq.{id}" +
                  $"&status=eq.approved" +
                  $"&select=id,competition_category_id,competition_type,club_id,created_at," +
                  $"players(id,full_name,ic_number,gender_id,age_group,weight_class,belt_rank_id)," +
                  $"clubs(id,name)" +
                  $"&order=competition_type.asc,created_at.asc";

        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var registrations = JsonSerializer.Deserialize<List<JsonElement>>(body) ?? new();

        // Group by competition_type + competition_category_id
        var grouped = registrations
            .GroupBy(r => new
            {
                CompetitionType = r.GetProperty("competition_type").GetString(),
                CompetitionCategoryId = r.GetProperty("competition_category_id").GetString()
            })
            .Select(g => new
            {
                competition_type = g.Key.CompetitionType,
                competition_category_id = g.Key.CompetitionCategoryId,
                player_count = g.Count(),
                players = g.Select(r => r).ToList()
            })
            .OrderBy(g => g.competition_type)
            .ToList();

        return Ok(new
        {
            tournament_id = id,
            total_approved = registrations.Count,
            categories = grouped
        });
    }

    /// <summary>GET /api/tournaments/{id}/payments — list clubs that uploaded receipts</summary>
    [HttpGet("{id}/payments")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> GetTournamentPayments(string id)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        var url = $"{SupabaseUrl}/rest/v1/club_payments" +
                  $"?tournament_id=eq.{id}" +
                  $"&select=id,club_id,receipt_url,total_amount,uploaded_at,created_at," +
                  $"clubs(id,name,contact_email,contact_phone)" +
                  $"&order=uploaded_at.desc";

        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var data = JsonSerializer.Deserialize<object>(body);
        return Ok(data);
    }

    /// <summary>GET /api/tournaments/{id}/payments/{clubId}/players — approved players under a club for this tournament</summary>
    [HttpGet("{id}/payments/{clubId}/players")]
    [AuthorizeRole("organiser")]
    public async Task<IActionResult> GetClubPlayers(string id, string clubId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var organiserId = await GetOrganiserIdAsync(userId);
        if (organiserId == null) return NotFound(new { error = "Organiser profile not found." });

        var client = CreateServiceClient();
        var existing = await GetTournamentForOrganiserAsync(client, id, organiserId);
        if (existing == null) return NotFound(new { error = "Tournament not found." });

        var url = $"{SupabaseUrl}/rest/v1/tournament_registrations" +
                  $"?tournament_id=eq.{id}" +
                  $"&club_id=eq.{clubId}" +
                  $"&status=eq.approved" +
                  $"&select=id,competition_category_id,competition_type,created_at," +
                  $"players(id,full_name,ic_number,gender_id,age_group,weight_class,belt_rank_id)" +
                  $"&order=competition_type.asc,created_at.asc";

        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, new { error = body });

        var registrations = JsonSerializer.Deserialize<List<JsonElement>>(body) ?? new();

        return Ok(new
        {
            tournament_id = id,
            club_id = clubId,
            total_players = registrations.Count,
            players = registrations
        });
    }

    // ─────────────────────────────────────────────
    // TOURNAMENT CATEGORIES
    // ─────────────────────────────────────────────

    /// <summary>GET /api/tournaments/{id}/categories — returns tournament categories with nested competition categories</summary>
    [HttpGet("{id}/categories")]
    public async Task<IActionResult> GetTournamentCategories(string id)
    {
        var client = CreateServiceClient();

        // Fetch tournament categories
        var tcUrl = $"{SupabaseUrl}/rest/v1/tournament_categories?tournament_id=eq.{id}&select=*&order=type.asc";
        var tcResponse = await client.GetAsync(tcUrl);
        var tcBody = await tcResponse.Content.ReadAsStringAsync();

        if (!tcResponse.IsSuccessStatusCode)
            return StatusCode((int)tcResponse.StatusCode, new { error = tcBody });

        var tournamentCategories = JsonSerializer.Deserialize<List<JsonElement>>(tcBody) ?? new();
        var validTypes = new[] { "kyorugi", "poomsae", "breaking", "speed_kicking", "vr", "freestyle" };

        var result = new List<object>();

        foreach (var tc in tournamentCategories)
        {
            var tcId = tc.GetProperty("id").GetString();
            var tcType = tc.GetProperty("type").GetString();

            if (tcId == null || tcType == null || !validTypes.Contains(tcType)) continue;

            var table = $"{tcType}_categories";

            // Fetch competition categories for this tournament category
            var ccUrl = $"{SupabaseUrl}/rest/v1/{table}?tournament_category_id=eq.{tcId}&select=*&order=name.asc";
            var ccResponse = await CreateServiceClient().GetAsync(ccUrl);
            var ccBody = await ccResponse.Content.ReadAsStringAsync();
            var competitionCategories = JsonSerializer.Deserialize<List<JsonElement>>(ccBody) ?? new();

            result.Add(new
            {
                id = tcId,
                tournament_id = id,
                type = tcType,
                competition_categories = competitionCategories
            });
        }

        return Ok(result);
    }

}

// ─────────────────────────────────────────────
// REQUEST MODELS
// ─────────────────────────────────────────────

public record CreateTournamentRequest(
    string Title,
    string Description,
    string VenueDetails,
    string Address,
    string StateId,
    string CityId,
    string? GoogleMapsLink,   // optional
    DateTime StartDate,
    DateTime EndDate,
    DateTime RegistrationOpen,
    DateTime RegistrationClose,
    int? MaxParticipants       // optional — null means unlimited
);

public class TournamentCategoryInput
{
    public string Type { get; set; } = "";
    public List<CompetitionCategoryInput>? CompetitionCategories { get; set; }
}

public class CompetitionCategoryInput
{
    public string Name { get; set; } = "";
    public List<string>? AgeGroupIds { get; set; }
    public List<string>? GenderIds { get; set; }
    public string? BeltRankFromId { get; set; }
    public string? BeltRankToId { get; set; }
    public string? DivisionId { get; set; }
    public bool IsTeam { get; set; } = false;
    public int? TeamSize { get; set; }
    public decimal? FeeAmount { get; set; }
    public string? KickType { get; set; }
    public string? BreakType { get; set; }
    public string? FreestyleType { get; set; }
}

public record UpdateTournamentRequest(
    string? Title,
    string? Description,
    string? VenueDetails,
    string? Address,
    string? StateId,
    string? CityId,
    string? GoogleMapsLink,
    DateTime? StartDate,
    DateTime? EndDate,
    DateTime? RegistrationOpen,
    DateTime? RegistrationClose,
    int? MaxParticipants
);