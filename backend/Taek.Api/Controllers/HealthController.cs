using Microsoft.AspNetCore.Mvc;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _config;

    public HealthController(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// Phase 0 health check — confirms API is running and Supabase URL is configured.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        var supabaseUrl = _config["Supabase:Url"];
        var dbConfigured = !string.IsNullOrEmpty(supabaseUrl);

        return Ok(new
        {
            status = "ok",
            service = "TAEK API",
            version = "0.1.0",
            phase = "Phase 0 — Skeleton",
            supabase_configured = dbConfigured,
            timestamp = DateTime.UtcNow
        });
    }
}
