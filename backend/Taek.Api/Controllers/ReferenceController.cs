using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/reference")]
public class ReferenceController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private string SupabaseUrl => _config["Supabase:Url"]!;
    private string ServiceKey => _config["Supabase:ServiceRoleKey"]!;

    public ReferenceController(IHttpClientFactory httpClientFactory, IConfiguration config)
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

    private async Task<IActionResult> FetchReference(string table, string orderBy = "name")
    {
        try
        {
            var client = CreateServiceClient();
            var url = $"{SupabaseUrl}/rest/v1/{table}?select=id,name&order={orderBy}.asc";

            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = body });

            var data = JsonSerializer.Deserialize<object>(body);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    // ─────────────────────────────────────────────
    // ENDPOINTS
    // ─────────────────────────────────────────────

    /// <summary>GET /api/reference/genders</summary>
    [HttpGet("genders")]
    public Task<IActionResult> GetGenders() =>
        FetchReference("genders");

    /// <summary>GET /api/reference/races</summary>
    [HttpGet("races")]
    public Task<IActionResult> GetRaces() =>
        FetchReference("races");

    /// <summary>GET /api/reference/belt-ranks — ordered by sort_order</summary>
    [HttpGet("belt-ranks")]
    public Task<IActionResult> GetBeltRanks() =>
        FetchReference("belt_ranks", orderBy: "sort_order");

    /// <summary>GET /api/reference/age-groups — ordered by min_age</summary>
    [HttpGet("age-groups")]
    public Task<IActionResult> GetAgeGroups() =>
        FetchReference("age_groups", orderBy: "min_age");

    /// <summary>GET /api/reference/divisions</summary>
    [HttpGet("divisions")]
    public Task<IActionResult> GetDivisions() =>
        FetchReference("divisions");

    /// <summary>GET /api/reference/taegeuks</summary>
    [HttpGet("taegeuks")]
    public Task<IActionResult> GetTaegeuks() =>
        FetchReference("taegeuks");

    /// <summary>GET /api/reference/vr-types</summary>
    [HttpGet("vr-types")]
    public Task<IActionResult> GetVrTypes() =>
        FetchReference("vr_types");

    /// <summary>
    /// GET /api/reference/weight-classes
    /// Optional: ?age_group_id=xxx  &amp;gender_id=xxx
    /// Used by frontend to populate weight class dropdowns filtered by player's age group + gender
    /// </summary>
    [HttpGet("weight-classes")]
    public async Task<IActionResult> GetWeightClasses(
        [FromQuery] string? age_group_id,
        [FromQuery] string? gender_id)
    {
        try
        {
            var client = CreateServiceClient();

            var filters = new List<string>();
            if (!string.IsNullOrEmpty(age_group_id))
                filters.Add($"age_group_id=eq.{age_group_id}");
            if (!string.IsNullOrEmpty(gender_id))
                filters.Add($"gender_id=eq.{gender_id}");

            var filterQuery = filters.Count > 0 ? "&" + string.Join("&", filters) : "";
            var url = $"{SupabaseUrl}/rest/v1/weight_classes?select=id,name,age_group_id,gender_id,min_weight_kg,max_weight_kg&order=min_weight_kg.asc{filterQuery}";

            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = body });

            var data = JsonSerializer.Deserialize<object>(body);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>GET /api/reference/states</summary>
    [HttpGet("states")]
    public Task<IActionResult> GetStates() =>
        FetchReference("states");

    /// <summary>
    /// GET /api/reference/cities
    /// Optional: ?state_id=xxx — filter cities by state
    /// </summary>
    [HttpGet("cities")]
    public async Task<IActionResult> GetCities([FromQuery] string? state_id)
    {
        try
        {
            var client = CreateServiceClient();
            var filter = !string.IsNullOrEmpty(state_id) ? $"&state_id=eq.{state_id}" : "";
            var url = $"{SupabaseUrl}/rest/v1/cities?select=id,name,state_id&order=name.asc{filter}";

            var response = await client.GetAsync(url);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { error = body });

            var data = JsonSerializer.Deserialize<object>(body);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}