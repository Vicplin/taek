namespace Taek.Api.Models.Profiles;

// Create player — IC parsing handles DOB for Malaysians
public record CreatePlayerRequest(
    string FullName,
    string? IcNumber,        // MyKad format: YYMMDD-PB-XXXG
    bool IsForeign,          // true = passport, DOB required manually
    DateTime? DateOfBirth,   // required if IsForeign = true
    string? GenderId,
    string? RaceId,
    string? BeltRankId,
    decimal? WeightKg,
    decimal? HeightCm,
    string? ClubId
);

public record UpdatePlayerRequest(
    string? FullName,
    string? IcNumber,
    bool? IsForeign,
    DateTime? DateOfBirth,
    string? GenderId,
    string? RaceId,
    string? BeltRankId,
    decimal? WeightKg,
    decimal? HeightCm,
    string? ClubId
);


public record RespondInvitationRequest(bool Accept);