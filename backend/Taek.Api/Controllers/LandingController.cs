using Microsoft.AspNetCore.Mvc;
using Taek.Api.Models.Db;
using Taek.Api.Models.Landing;
using Supabase.Postgrest;
using Supabase.Postgrest.Interfaces;
using static Supabase.Postgrest.Constants;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LandingController : ControllerBase
{
    private readonly Supabase.Client _supabase;

    public LandingController(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    [HttpGet]
    public async Task<ActionResult<LandingData>> GetLandingData()
    {
        try
        {
            // 1. Fetch featured tournaments
            // Statuses: published, open, UPCOMING, OPEN, upcoming
            // Note: Operator.In is causing issues with the current library version, so we filter in memory for now.
            
            var tournamentsResponse = await _supabase
                .From<Tournament>()
                .Order("date", Ordering.Ascending)
                .Get();

            var statusList = new List<string> { "published", "open", "UPCOMING", "OPEN", "upcoming" };
            var featuredTournaments = tournamentsResponse.Models
                .Where(t => statusList.Contains(t.Status))
                .Take(3)
                .ToList();

            // 2. Stats - Active Players (approved)
            // Note: count: exact, head: true (to only get count, not data)
            var activePlayers = await _supabase
                .From<Player>()
                .Count(CountType.Exact);

            // 3. Stats - Total Tournaments
            var totalTournaments = await _supabase
                .From<Tournament>()
                .Count(CountType.Exact);

            // 4. Stats - Partner Clubs (active)
            var clubsResponse = await _supabase
                .From<Club>()
                .Get();
            var partnerClubs = clubsResponse.Models.Count(c => c.IsActive);

            return Ok(new LandingData
            {
                FeaturedTournaments = featuredTournaments,
                Stats = new LandingStats
                {
                    ActivePlayers = (int)activePlayers,
                    Tournaments = (int)totalTournaments,
                    PartnerClubs = partnerClubs
                }
            });
        }
        catch (Exception ex)
        {
            // Log error
            Console.WriteLine($"Error fetching landing data: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            return StatusCode(500, new { error = "Failed to fetch landing data", details = ex.ToString() });
        }
    }
}
