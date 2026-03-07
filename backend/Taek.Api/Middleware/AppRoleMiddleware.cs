using System.Security.Claims;
using System.Text.Json;
using Taek.Api.Models.Db;

namespace Taek.Api.Middleware;

public class AppRoleMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AppRoleMiddleware> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public AppRoleMiddleware(RequestDelegate next, ILogger<AppRoleMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
        _httpClient = new HttpClient();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? context.User.FindFirstValue("sub");

            if (!string.IsNullOrEmpty(userId))
            {
                // Check if role is already present
                if (context.User.IsInRole("admin") || 
                    context.User.IsInRole("organiser") || 
                    context.User.IsInRole("club") || 
                    context.User.IsInRole("parent") || 
                    context.User.IsInRole("individual"))
                {
                    await _next(context);
                    return;
                }

                try 
                {
                    var supabaseUrl = _configuration["Supabase:Url"];
                    var serviceKey = _configuration["Supabase:ServiceRoleKey"];
                    
                    var request = new HttpRequestMessage(HttpMethod.Get, $"{supabaseUrl}/rest/v1/users?id=eq.{userId}&select=role");
                    request.Headers.Add("apikey", serviceKey);
                    request.Headers.Add("Authorization", $"Bearer {serviceKey}");

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.GetArrayLength() > 0)
                        {
                            var role = doc.RootElement[0].GetProperty("role").GetString();
                            if (!string.IsNullOrEmpty(role))
                            {
                                var claims = new List<Claim>
                                {
                                    new Claim(ClaimTypes.Role, role)
                                };
                                
                                var appIdentity = new ClaimsIdentity(claims, "Database", "name", ClaimTypes.Role);
                                context.User.AddIdentity(appIdentity);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching user role");
                }
            }
        }

        await _next(context);
    }
}
