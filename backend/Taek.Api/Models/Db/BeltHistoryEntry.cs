namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("belt_history")]
public class BeltHistoryEntry : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("player_id")]
    public string PlayerId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("belt_color")]
    public string BeltColor { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("awarded_at")]
    public DateTime AwardedAt { get; set; }

    [Supabase.Postgrest.Attributes.Column("awarded_by")]
    public string? AwardedBy { get; set; }
}

