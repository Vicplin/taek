using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("belt_ranks")]
public class BeltRank : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("name")]
    public string Name { get; set; } = default!;

    [Column("sort_order")]
    public int SortOrder { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
