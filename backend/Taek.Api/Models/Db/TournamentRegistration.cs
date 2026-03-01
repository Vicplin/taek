using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("tournament_registrations")]
public class TournamentRegistration : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("tournament_id")]
    public string TournamentId { get; set; } = default!;

    [Reference(typeof(Tournament))]
    public Tournament? Tournament { get; set; }

    [Column("fighter_id")]
    public string PlayerId { get; set; } = default!;

    [Reference(typeof(Player))]
    public Player? Player { get; set; }

    [Column("category")]
    public string? Category { get; set; }

    [Column("status")]
    public string Status { get; set; } = "PENDING";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
