using Microsoft.AspNetCore.Mvc;
using Taek.Api.Models.Db;

namespace Taek.Api.Controllers;

[ApiController]
[Route("reference")]
public class ReferenceController : ControllerBase
{
    private readonly Supabase.Client _supabase;

    public ReferenceController(Supabase.Client supabase)
    {
        _supabase = supabase;
    }

    [HttpGet("genders")]
    public async Task<IActionResult> GetGenders()
    {
        try
        {
            var response = await _supabase
                .From<Gender>()
                .Select("name")
                .Get();

            var genders = response.Models
                .Select(g => g.Name)
                .OrderBy(n => n)
                .ToList();

            return Ok(genders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("races")]
    public async Task<IActionResult> GetRaces()
    {
        try
        {
            var response = await _supabase
                .From<Race>()
                .Select("name")
                .Get();

            var races = response.Models
                .Select(r => r.Name)
                .OrderBy(n => n)
                .ToList();

            return Ok(races);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("belts")]
    public async Task<IActionResult> GetBeltRanks()
    {
        try
        {
            var response = await _supabase
                .From<BeltRank>()
                .Select("name, sort_order")
                .Order("sort_order", Supabase.Postgrest.Constants.Ordering.Ascending)
                .Get();

            var belts = response.Models
                .Select(b => b.Name)
                .ToList();

            return Ok(belts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
