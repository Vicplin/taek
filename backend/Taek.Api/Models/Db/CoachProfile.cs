namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("coach_profiles")]
public class CoachProfile : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("user_id")]
    public string UserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("club_id")]
    public string? ClubId { get; set; }

    [Supabase.Postgrest.Attributes.Column("certification_level")]
    public string? CertificationLevel { get; set; }

    [Supabase.Postgrest.Attributes.Column("licence_no")]
    public string? LicenceNo { get; set; }

    [Supabase.Postgrest.Attributes.Column("belt_rank")]
    public string? BeltRank { get; set; }

    [Supabase.Postgrest.Attributes.Column("affiliated_club_id")]
    public string? AffiliatedClubId { get; set; }

    [Supabase.Postgrest.Attributes.Column("state")]
    public string? State { get; set; }

    [Supabase.Postgrest.Attributes.Column("phone")]
    public string? Phone { get; set; }

    [Supabase.Postgrest.Attributes.Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Supabase.Postgrest.Attributes.Column("verified")]
    public bool Verified { get; set; }
}

