using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Taek.Api.Models.Db;
using Supabase.Postgrest;
using static Supabase.Postgrest.Constants;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly Supabase.Client _supabase;

    public DashboardController(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("players")]
    public async Task<IActionResult> GetMyPlayers()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var response = await _supabase
                .From<Player>()
                .Select("*, club:clubs(name)")
                .Filter("user_id", Operator.Equals, userId)
                .Order("created_at", Ordering.Descending)
                .Get();

            return Ok(response.Models);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch players", details = ex.Message });
        }
    }

    [HttpGet("registrations")]
    public async Task<IActionResult> GetMyRegistrations()
    {
        var userId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            // Fetch registrations where the player belongs to the current user
            // Use !inner join on fighters to filter by user_id
            var response = await _supabase
                .From<TournamentRegistration>()
                .Select("*, tournament:tournaments(*), player:fighters!inner(*, club:clubs(name))")
                .Filter("player.user_id", Operator.Equals, userId)
                .Get();

            return Ok(response.Models);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch registrations", details = ex.Message });
        }
    }
}
