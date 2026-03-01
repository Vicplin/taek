namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("coach_roster")]
public class CoachRosterEntry : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("coach_user_id")]
    public string CoachUserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("player_user_id")]
    public string PlayerUserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("status")]
    public string Status { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("invited_at")]
    public DateTime InvitedAt { get; set; }

    [Supabase.Postgrest.Attributes.Column("responded_at")]
    public DateTime? RespondedAt { get; set; }
}

