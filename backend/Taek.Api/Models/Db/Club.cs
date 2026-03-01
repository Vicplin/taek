using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("clubs")]
public class Club : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("name")]
    public string Name { get; set; } = default!;

    [Column("coach_id")]
    public string CoachId { get; set; } = default!;

    [Column("location")]
    public string? Location { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
