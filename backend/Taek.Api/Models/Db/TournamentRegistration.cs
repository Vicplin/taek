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

    [Column("player_id")]
    public string PlayerId { get; set; } = default!;

    [Reference(typeof(Player))]
    public Player? Player { get; set; }

    [Column("competition_category_id")]
    public string CompetitionCategoryId { get; set; } = default!;

    [Column("competition_type")]
    public string CompetitionType { get; set; } = default!;

    [Column("club_id")]
    public string? ClubId { get; set; }

    [Reference(typeof(Club))]
    public Club? Club { get; set; }

    [Column("status")]
    public string Status { get; set; } = "pending";

    [Column("rejection_reason")]
    public string? RejectionReason { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
