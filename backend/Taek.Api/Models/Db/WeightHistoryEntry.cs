namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("weight_history")]
public class WeightHistoryEntry : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("player_id")]
    public string PlayerId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("weight_kg")]
    public decimal WeightKg { get; set; }

    [Supabase.Postgrest.Attributes.Column("recorded_at")]
    public DateTime? RecordedAt { get; set; }
}

