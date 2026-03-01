namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("player_profiles")]
public class PlayerProfile : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("user_id")]
    public string UserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("club_id")]
    public string? ClubId { get; set; }

    [Supabase.Postgrest.Attributes.Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [Supabase.Postgrest.Attributes.Column("gender")]
    public string? Gender { get; set; }

    [Supabase.Postgrest.Attributes.Column("weight_kg")]
    public decimal? WeightKg { get; set; }

    [Supabase.Postgrest.Attributes.Column("height_cm")]
    public decimal? HeightCm { get; set; }

    [Supabase.Postgrest.Attributes.Column("ic_number")]
    public string? IcNumber { get; set; }

    [Supabase.Postgrest.Attributes.Column("nationality")]
    public string? Nationality { get; set; }

    [Supabase.Postgrest.Attributes.Column("phone")]
    public string? Phone { get; set; }

    [Supabase.Postgrest.Attributes.Column("belt_rank")]
    public string? BeltRank { get; set; }

    [Supabase.Postgrest.Attributes.Column("state")]
    public string? State { get; set; }

    [Supabase.Postgrest.Attributes.Column("emergency_contact_name")]
    public string? EmergencyContactName { get; set; }

    [Supabase.Postgrest.Attributes.Column("emergency_contact_phone")]
    public string? EmergencyContactPhone { get; set; }

    [Supabase.Postgrest.Attributes.Column("avatar_url")]
    public string? AvatarUrl { get; set; }
}

