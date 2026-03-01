using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("tournaments")]
public class Tournament : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("title")]
    public string Title { get; set; } = default!;

    [Column("description")]
    public string? Description { get; set; }

    [Column("date")]
    public DateTime Date { get; set; }

    [Column("registration_deadline")]
    public DateTime? RegistrationDeadline { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("current_spots")]
    public int CurrentSpots { get; set; }

    [Column("max_spots")]
    public int? MaxSpots { get; set; }

    [Column("status")]
    public string Status { get; set; } = "upcoming";

    [Column("image")]
    public string? Image { get; set; }

    [Column("categories")]
    public List<string> Categories { get; set; } = new();

    [Column("prize_pool")]
    public string? PrizePool { get; set; }

    [Column("entry_fee_min")]
    public decimal? EntryFeeMin { get; set; }

    [Column("entry_fee_max")]
    public decimal? EntryFeeMax { get; set; }

    [Column("organiser_id")]
    public string? OrganiserId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
