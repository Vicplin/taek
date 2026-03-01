using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("genders")]
public class Gender : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("name")]
    public string Name { get; set; } = default!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
