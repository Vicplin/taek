using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("fighters")]
public class Player : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("user_id")]
    public string UserId { get; set; } = default!;

    [Column("full_name")]
    public string FullName { get; set; } = default!;

    [Column("ic_number")]
    public string? IcNumber { get; set; }

    [Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [Column("gender")]
    public string? Gender { get; set; }

    [Column("race")]
    public string? Race { get; set; }

    [Column("belt_rank")]
    public string? BeltRank { get; set; }

    [Column("weight_kg")]
    public decimal? WeightKg { get; set; }

    [Column("height_cm")]
    public decimal? HeightCm { get; set; }

    [Column("club_id")]
    public string? ClubId { get; set; }

    [Reference(typeof(Club))]
    public Club? Club { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
