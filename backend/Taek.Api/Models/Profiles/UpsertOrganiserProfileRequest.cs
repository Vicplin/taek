namespace Taek.Api.Models.Profiles;

public record UpsertOrganiserProfileRequest(
    string OrgName,
    string? ContactName,
    string? ContactEmail,
    string? ContactPhone,
    string? State
);