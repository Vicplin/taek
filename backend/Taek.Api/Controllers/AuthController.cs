using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Supabase.Gotrue;
using Taek.Api.Models.Auth;
using Taek.Api.Models.Db;
using System.Security.Claims;
using System.Net.Http;

namespace Taek.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly Supabase.Client _supabase;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(Supabase.Client supabase, ILogger<AuthController> logger, IConfiguration configuration)
    {
        _supabase = supabase;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Registers a new user and creates a profile in the users table via Supabase Auth.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Domain check
            var restrictedDomains = new[] { "@taekadmin.com", "@taekclub.com", "@taekorg.com" };
            if (restrictedDomains.Any(d => request.Email.EndsWith(d, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { error = "This email domain is not available for public registration." });
            }

            // 1. Sign up with Supabase Auth
            var options = new SignUpOptions 
            { 
                Data = new Dictionary<string, object> 
                { 
                    { "full_name", request.FullName },
                    { "phone", request.PhoneNumber ?? "" }
                } 
            };
            var session = await _supabase.Auth.SignUp(request.Email, request.Password, options);
            
            if (session?.User == null)
            {
                return BadRequest(new { error = "Registration failed. User could not be created." });
            }

            // The DB trigger 'on_auth_user_created' will automatically insert into public.users with role = 'individual'.
            
            return Ok(new { message = "Registration successful.", userId = session.User.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Verifies the user is a regular user (individual or parent)
    /// </summary>
    [HttpGet("verify-user")]
    [Authorize]
    public IActionResult VerifyUser()
    {
        var role = User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .FirstOrDefault(r => r is "individual" or "parent" or "club" or "organiser" or "admin");

        if (role == null)
            return Unauthorized(new { error = "No app role found." });

        if (role is "admin" or "organiser" or "club")
            return Unauthorized(new { error = "Please use the staff login page." });

        return Ok(new { role });
    }

    /// <summary>
    /// Verifies the user is a staff member (admin, coach or organiser)
    /// </summary>
    [HttpGet("verify-staff")]
    [Authorize]
    public IActionResult VerifyStaff()
    {
        var role = User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .FirstOrDefault(r => r is "individual" or "parent" or "club" or "organiser" or "admin");

        if (role == null)
            return Unauthorized(new { error = "No app role found." });

        if (role is not ("admin" or "organiser" or "club"))
            return Unauthorized(new { error = "You do not have staff access." });

        return Ok(new { role });
    }

    [HttpGet("debug")]
    [Authorize]
    public IActionResult Debug()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        var isAuthenticated = User.Identity?.IsAuthenticated;
        var role = User.FindFirstValue(ClaimTypes.Role);

        return Ok(new
        {
            isAuthenticated,
            role,
            claims
        });
    }

    /// <summary>
    /// Refreshes the JWT token.
    /// </summary>
    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        try
        {
             return StatusCode(501, new { message = "Use Supabase Client SDK for token refresh" });
        }
        catch (Exception ex)
        {
             return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
/// Logs in a user and returns the JWT access token.
/// </summary>
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    try
    {
        var session = await _supabase.Auth.SignIn(request.Email, request.Password);

        if (session?.AccessToken == null)
            return Unauthorized(new { error = "Invalid email or password." });

        return Ok(new
        {
            accessToken  = session.AccessToken,
            refreshToken = session.RefreshToken,
            userId       = session.User!.Id
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Login failed for {Email}", request.Email);
        return Unauthorized(new { error = "Invalid email or password." });
    }
}

    /// <summary>
    /// Debug: Test if JWKS endpoint is reachable
    /// </summary>
    [HttpGet("debug-jwks")]
    public async Task<IActionResult> DebugJwks()
    {
        try
        {
            var supabaseUrl = _configuration["Supabase:Url"];
            var jwksUrl = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";
            
            using var http = new HttpClient();
            http.Timeout = TimeSpan.FromSeconds(10);
            var response = await http.GetStringAsync(jwksUrl);
            
            return Ok(new { jwksUrl, response });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Logs out (revokes token).
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            await _supabase.Auth.SignOut();
            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Sends a password reset email to the user.
    /// </summary>
    [HttpPost("recover")]
    public async Task<IActionResult> Recover([FromBody] RecoverRequest request)
    {
        try
        {
            await _supabase.Auth.ResetPasswordForEmail(request.Email);
            return Ok(new { message = "Password reset email sent." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Updates the user's password. Requires an authenticated session (e.g., from the reset link).
    /// </summary>
    [HttpPost("reset-password")]
    [Authorize]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var attrs = new UserAttributes { Password = request.Password };
            var user = await _supabase.Auth.Update(attrs);

            if (user == null)
            {
                 return BadRequest(new { error = "Failed to update password." });
            }

            return Ok(new { message = "Password updated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
