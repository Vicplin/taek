using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("players")]
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

    [Column("is_foreign")]
    public bool IsForeign { get; set; } = false;

    [Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [Column("gender_id")]
    public string? GenderId { get; set; }

    [Column("race_id")]
    public string? RaceId { get; set; }

    [Column("belt_rank_id")]
    public string? BeltRankId { get; set; }

    [Column("weight_kg")]
    public decimal? WeightKg { get; set; }

    [Column("height_cm")]
    public decimal? HeightCm { get; set; }

    [Column("club_id")]
    public string? ClubId { get; set; }

    [Reference(typeof(Club))]
    public Club? Club { get; set; }

    [Column("age_group")]
    public string? AgeGroup { get; set; }

    [Column("weight_class")]
    public string? WeightClass { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
