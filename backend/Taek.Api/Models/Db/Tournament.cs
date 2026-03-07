using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("tournaments")]
public class Tournament : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("organiser_id")]
    public string? OrganiserId { get; set; }

    [Column("title")]
    public string Title { get; set; } = default!;

    [Column("description")]
    public string? Description { get; set; }

    [Column("image")]
    public string? Image { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("start_date")]
    public DateTime? StartDate { get; set; }

    [Column("end_date")]
    public DateTime? EndDate { get; set; }

    [Column("registration_open")]
    public DateTime? RegistrationOpen { get; set; }

    [Column("registration_close")]
    public DateTime? RegistrationClose { get; set; }

    [Column("max_participants")]
    public int? MaxParticipants { get; set; }

    [Column("status")]
    public string Status { get; set; } = "upcoming";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
