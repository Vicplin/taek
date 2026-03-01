using System.Security.Claims;
using Taek.Api.Models.Db;

namespace Taek.Api.Middleware;

public class AppRoleMiddleware
{
    private readonly RequestDelegate _next;

    public AppRoleMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, Supabase.Client supabase)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var roleClaims = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();
            var alreadyHasAppRole = roleClaims.Any(r => r is "player" or "coach" or "organiser" or "admin");

            if (!alreadyHasAppRole)
            {
                var userId = context.User.FindFirstValue("sub") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrWhiteSpace(userId) && context.User.Identity is ClaimsIdentity identity)
                {
                    try
                    {
                        var appUser = await supabase.From<AppUser>().Where(u => u.Id == userId).Single();
                        if (appUser != null && !string.IsNullOrWhiteSpace(appUser.Role))
                        {
                            identity.AddClaim(new Claim(ClaimTypes.Role, appUser.Role));
                        }
                    }
                    catch
                    {
                    }
                }
            }
        }

        await _next(context);
    }
}

