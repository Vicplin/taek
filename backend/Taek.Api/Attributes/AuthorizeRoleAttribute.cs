using Microsoft.AspNetCore.Authorization;

namespace Taek.Api.Attributes;

public class AuthorizeRoleAttribute : AuthorizeAttribute
{
    public AuthorizeRoleAttribute(params string[] roles)
    {
        Roles = string.Join(",", roles);
    }
}
