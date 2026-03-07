using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using Taek.Api.Models.Db;
using Taek.Api.Models.Profiles;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/players")]
[Authorize]
public class PlayersController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PlayersController> _logger;

    public PlayersController(Supabase.Client supabase, IConfiguration configuration, ILogger<PlayersController> logger)
    {
        _supabase = supabase;
        _configuration = configuration;
        _logger = logger;
    }

    // ─── GET /api/players ─────────────────────────────────────────────────────

    /// <summary>
    /// Returns all players belonging to the current user.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPlayers()
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _supabase.From<Player>()
                .Where(p => p.UserId == userId)
                .Get();

            return Ok(response.Models.Select(ToDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get players");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── GET /api/players/{id} ────────────────────────────────────────────────

    /// <summary>
    /// Returns a single player by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlayer(string id)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var player = await _supabase.From<Player>()
                .Where(p => p.Id == id && p.UserId == userId)
                .Single();

            if (player == null)
                return NotFound(new { error = "Player not found." });

            return Ok(ToDto(player));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get player {Id}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── POST /api/players ────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new player. Individual accounts limited to 1 player.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePlayer([FromBody] CreatePlayerRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var role = GetRole();

            // Individual limit — also enforced by DB trigger
            if (role == "individual")
            {
                var existing = await _supabase.From<Player>()
                    .Where(p => p.UserId == userId)
                    .Get();

                if (existing.Models.Count >= 1)
                    return BadRequest(new { error = "Individual accounts can only have 1 player." });
            }

            // Validate foreign player has DOB
            if (request.IsForeign && request.DateOfBirth == null)
                return BadRequest(new { error = "Date of birth is required for foreign players." });

            // Parse DOB from IC for Malaysian players
            DateTime? dob = request.IsForeign
                ? request.DateOfBirth
                : ParseDobFromIc(request.IcNumber);

            if (dob == null && !request.IsForeign)
                return BadRequest(new { error = "Invalid IC number format. Expected YYMMDD-PB-XXXG." });

            // Calculate age group
            var ageGroup = dob.HasValue ? CalculateAgeGroup(dob.Value) : null;

            // Lookup gender name from DB
            var genderName = await GetGenderNameAsync(request.GenderId);

            // Calculate weight class
            var weightClass = CalculateWeightClass(ageGroup, request.WeightKg, genderName);

            var player = new Player
            {
                UserId      = userId,
                FullName    = request.FullName,
                IcNumber    = request.IcNumber,
                IsForeign   = request.IsForeign,
                DateOfBirth = dob,
                GenderId    = request.GenderId,
                RaceId      = request.RaceId,
                BeltRankId  = request.BeltRankId,
                WeightKg    = request.WeightKg,
                HeightCm    = request.HeightCm,
                ClubId      = request.ClubId,
                AgeGroup    = ageGroup,
                WeightClass = weightClass
            };

            var result = await _supabase.From<Player>().Insert(player);
            var created = result.Models.FirstOrDefault();

            if (created == null)
                return StatusCode(500, new { error = "Failed to create player." });

            return Ok(ToDto(created));
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("ERR_LIMIT_REACHED"))
                return BadRequest(new { error = "Individual accounts can only have 1 player." });

            _logger.LogError(ex, "Failed to create player");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── PUT /api/players/{id} ────────────────────────────────────────────────

    /// <summary>
    /// Updates an existing player.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlayer(string id, [FromBody] UpdatePlayerRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var player = await _supabase.From<Player>()
                .Where(p => p.Id == id && p.UserId == userId)
                .Single();

            if (player == null)
                return NotFound(new { error = "Player not found." });

            // Update fields
            if (request.FullName != null)   player.FullName   = request.FullName;
            if (request.IcNumber != null)   player.IcNumber   = request.IcNumber;
            if (request.IsForeign != null)  player.IsForeign  = request.IsForeign.Value;
            if (request.GenderId != null)   player.GenderId   = request.GenderId;
            if (request.RaceId != null)     player.RaceId     = request.RaceId;
            if (request.BeltRankId != null) player.BeltRankId = request.BeltRankId;
            if (request.WeightKg != null)   player.WeightKg   = request.WeightKg;
            if (request.HeightCm != null)   player.HeightCm   = request.HeightCm;
            if (request.ClubId != null)     player.ClubId     = request.ClubId;

            // Recalculate DOB if IC changed
            if (request.IcNumber != null && !player.IsForeign)
            {
                var newDob = ParseDobFromIc(request.IcNumber);
                if (newDob != null) player.DateOfBirth = newDob;
            }

            if (request.DateOfBirth != null && player.IsForeign)
                player.DateOfBirth = request.DateOfBirth;

            // Recalculate age group
            player.AgeGroup = player.DateOfBirth.HasValue
                ? CalculateAgeGroup(player.DateOfBirth.Value)
                : player.AgeGroup;

            // Lookup gender name and recalculate weight class
            var genderName  = await GetGenderNameAsync(player.GenderId);
            player.WeightClass = CalculateWeightClass(
                player.AgeGroup,
                player.WeightKg,
                genderName
            );

            await _supabase.From<Player>().Update(player);

            var updated = await _supabase.From<Player>()
                .Where(p => p.Id == id)
                .Single();

            return Ok(ToDto(updated!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update player {Id}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── DELETE /api/players/{id} ─────────────────────────────────────────────

    /// <summary>
    /// Deletes a player.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlayer(string id)
    {
        try
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var player = await _supabase.From<Player>()
                .Where(p => p.Id == id && p.UserId == userId)
                .Single();

            if (player == null)
                return NotFound(new { error = "Player not found." });

            await _supabase.From<Player>()
                .Where(p => p.Id == id)
                .Delete();

            return Ok(new { message = "Player deleted successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete player {Id}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ─── IC Parsing ───────────────────────────────────────────────────────────

    private static DateTime? ParseDobFromIc(string? ic)
    {
        if (string.IsNullOrWhiteSpace(ic)) return null;

        var clean = ic.Replace("-", "").Replace(" ", "");
        if (clean.Length < 6) return null;

        try
        {
            var yy = int.Parse(clean[..2]);
            var mm = int.Parse(clean[2..4]);
            var dd = int.Parse(clean[4..6]);

            var currentYY = DateTime.Now.Year % 100;
            var year = yy > currentYY ? 1900 + yy : 2000 + yy;

            return new DateTime(year, mm, dd);
        }
        catch
        {
            return null;
        }
    }

    // ─── Age Group Calculation ────────────────────────────────────────────────

    private static string? CalculateAgeGroup(DateTime dob)
    {
        // Calculate age by year only — no month/day consideration
        var age = DateTime.Today.Year - dob.Year;

        return age switch
        {
            >= 9  and <= 11 => "Super Cadet",
            >= 12 and <= 14 => "Cadet",
            >= 15 and <= 17 => "Junior",
            >= 18           => "Senior",
            _               => null
        };
    }

    // ─── Weight Class Calculation ─────────────────────────────────────────────

    private static string? CalculateWeightClass(string? ageGroup, decimal? weightKg, string? genderName)
    {
        if (ageGroup == null || weightKg == null || genderName == null)
            return null;

        var w = weightKg.Value;
        var g = genderName.ToLower();

        return ageGroup switch
        {
            "Super Cadet" => g == "male" ? SuperCadetMale(w)   : SuperCadetFemale(w),
            "Cadet"       => g == "male" ? CadetMale(w)        : CadetFemale(w),
            "Junior"      => g == "male" ? JuniorMale(w)       : JuniorFemale(w),
            "Senior"      => g == "male" ? SeniorMale(w)       : SeniorFemale(w),
            _             => null
        };
    }

    private static string SuperCadetMale(decimal w) => w switch
    {
        <= 20              => "Fin (≤20kg)",
        <= 23              => "Fly (20.1-23kg)",
        <= 26              => "Bantam (23.1-26kg)",
        <= 29              => "Feather (26.1-29kg)",
        <= 32              => "Light (29.1-32kg)",
        <= 36              => "Welter (32.1-36kg)",
        <= 40              => "Middle (36.1-40kg)",
        _                  => "Heavy (>40kg)"
    };

    private static string SuperCadetFemale(decimal w) => w switch
    {
        <= 18              => "Fin (≤18kg)",
        <= 21              => "Fly (18.1-21kg)",
        <= 24              => "Bantam (21.1-24kg)",
        <= 27              => "Feather (24.1-27kg)",
        <= 30              => "Light (27.1-30kg)",
        <= 34              => "Welter (30.1-34kg)",
        <= 38              => "Middle (34.1-38kg)",
        _                  => "Heavy (>38kg)"
    };

    private static string CadetMale(decimal w) => w switch
    {
        <= 33              => "Fin (≤33kg)",
        <= 37              => "Fly (33.1-37kg)",
        <= 41              => "Bantam (37.1-41kg)",
        <= 45              => "Feather (41.1-45kg)",
        <= 49              => "Light (45.1-49kg)",
        <= 53              => "Light Welter (49.1-53kg)",
        <= 57              => "Welter (53.1-57kg)",
        <= 61              => "Light Middle (57.1-61kg)",
        <= 65              => "Middle (61.1-65kg)",
        _                  => "Heavy (>65kg)"
    };

    private static string CadetFemale(decimal w) => w switch
    {
        <= 29              => "Fin (≤29kg)",
        <= 33              => "Fly (29.1-33kg)",
        <= 37              => "Bantam (33.1-37kg)",
        <= 41              => "Feather (37.1-41kg)",
        <= 44              => "Light (41.1-44kg)",
        <= 47              => "Light Welter (44.1-47kg)",
        <= 51              => "Welter (47.1-51kg)",
        <= 55              => "Light Middle (51.1-55kg)",
        <= 59              => "Middle (55.1-59kg)",
        _                  => "Heavy (>59kg)"
    };

    private static string JuniorMale(decimal w) => w switch
    {
        <= 45              => "Fin (≤45kg)",
        <= 48              => "Fly (45.1-48kg)",
        <= 51              => "Bantam (48.1-51kg)",
        <= 55              => "Feather (51.1-55kg)",
        <= 59              => "Light (55.1-59kg)",
        <= 63              => "Light Welter (59.1-63kg)",
        <= 68              => "Welter (63.1-68kg)",
        <= 73              => "Light Middle (68.1-73kg)",
        <= 78              => "Middle (73.1-78kg)",
        _                  => "Heavy (>78kg)"
    };

    private static string JuniorFemale(decimal w) => w switch
    {
        <= 42              => "Fin (≤42kg)",
        <= 44              => "Fly (42.1-44kg)",
        <= 46              => "Bantam (44.1-46kg)",
        <= 49              => "Feather (46.1-49kg)",
        <= 52              => "Light (49.1-52kg)",
        <= 55              => "Light Welter (52.1-55kg)",
        <= 59              => "Welter (55.1-59kg)",
        <= 63              => "Light Middle (59.1-63kg)",
        <= 68              => "Middle (63.1-68kg)",
        _                  => "Heavy (>68kg)"
    };

    private static string SeniorMale(decimal w) => w switch
    {
        <= 54              => "Fin (≤54kg)",
        <= 58              => "Fly (54.1-58kg)",
        <= 63              => "Bantam (58.1-63kg)",
        <= 68              => "Feather (63.1-68kg)",
        <= 74              => "Light (68.1-74kg)",
        <= 80              => "Welter (74.1-80kg)",
        <= 87              => "Middle (80.1-87kg)",
        _                  => "Heavy (>87kg)"
    };

    private static string SeniorFemale(decimal w) => w switch
    {
        <= 46              => "Fin (≤46kg)",
        <= 49              => "Fly (46.1-49kg)",
        <= 53              => "Bantam (49.1-53kg)",
        <= 57              => "Feather (53.1-57kg)",
        <= 62              => "Light (57.1-62kg)",
        <= 67              => "Welter (62.1-67kg)",
        <= 73              => "Middle (67.1-73kg)",
        _                  => "Heavy (>73kg)"
    };

    // ─── Gender Lookup ────────────────────────────────────────────────────────

    private async Task<string?> GetGenderNameAsync(string? genderId)
    {
        if (string.IsNullOrEmpty(genderId)) return null;

        try
        {
            var supabaseUrl = _configuration["Supabase:Url"]!;
            var serviceKey  = _configuration["Supabase:ServiceRoleKey"]!;

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("apikey", serviceKey);
            http.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceKey}");

            var url      = $"{supabaseUrl}/rest/v1/genders?id=eq.{genderId}&select=name&limit=1";
            var response = await http.GetAsync(url);

            if (!response.IsSuccessStatusCode) return null;

            var json    = await response.Content.ReadAsStringAsync();
            var results = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(json);

            return results?.FirstOrDefault()?.GetValueOrDefault("name").GetString();
        }
        catch
        {
            return null;
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private string? GetUserId() =>
        User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

    private string? GetRole() =>
        User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .FirstOrDefault(r => r is "individual" or "parent" or "club" or "organiser" or "admin");

    private static object ToDto(Player p) => new
    {
        id          = p.Id,
        userId      = p.UserId,
        fullName    = p.FullName,
        icNumber    = p.IcNumber,
        isForeign   = p.IsForeign,
        dateOfBirth = p.DateOfBirth,
        genderId    = p.GenderId,
        raceId      = p.RaceId,
        beltRankId  = p.BeltRankId,
        weightKg    = p.WeightKg,
        heightCm    = p.HeightCm,
        clubId      = p.ClubId,
        ageGroup    = p.AgeGroup,
        weightClass = p.WeightClass,
        createdAt   = p.CreatedAt,
        updatedAt   = p.UpdatedAt
    };
}