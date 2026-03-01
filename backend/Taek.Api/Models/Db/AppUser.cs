namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("users")]
public class AppUser : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("email")]
    public string Email { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("full_name")]
    public string? FullName { get; set; }

    [Supabase.Postgrest.Attributes.Column("role")]
    public string Role { get; set; } = default!;
}

