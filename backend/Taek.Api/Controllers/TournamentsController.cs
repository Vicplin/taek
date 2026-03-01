using Microsoft.AspNetCore.Mvc;
using Taek.Api.Models.Db;
using Supabase.Postgrest;
using static Supabase.Postgrest.Constants;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TournamentsController : ControllerBase
{
    private readonly Supabase.Client _supabase;

    public TournamentsController(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    [HttpGet]
    public async Task<IActionResult> GetTournaments()
    {
        try
        {
            var response = await _supabase
                .From<Tournament>()
                .Select("*")
                .Order("date", Ordering.Ascending)
                .Get();

            return Ok(response.Models);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch tournaments", details = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTournament(string id)
    {
        try
        {
            var response = await _supabase
                .From<Tournament>()
                .Where(t => t.Id == id)
                .Single();

            if (response == null)
            {
                return NotFound();
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch tournament", details = ex.Message });
        }
    }
}
