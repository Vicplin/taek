namespace Taek.Api.Models.Profiles;

public record UpsertPlayerProfileRequest(
    string? FullName,
    DateTime? Dob,
    string? IcNumber,
    string? Nationality,
    string? Gender,
    string? Phone,
    string? BeltRank,
    decimal? WeightKg,
    string? ClubId,
    string? State,
    string? EmergencyContactName,
    string? EmergencyContactPhone
);

public record UpsertCoachProfileRequest(
    string? FullName,
    string? LicenceNo,
    string? BeltRank,
    string? AffiliatedClubId,
    string? State,
    string? Phone,
    string? AvatarUrl
);

public record UpsertOrganiserProfileRequest(
    string OrgName,
    string? LogoUrl,
    string? ContactName,
    string? ContactEmail,
    string? ContactPhone,
    string? State
);

public record InviteAthleteRequest(string Email);

public record RespondInvitationRequest(bool Accept);

