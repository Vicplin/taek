namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("organiser_profiles")]
public class OrganiserProfile : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("user_id")]
    public string UserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("org_name")]
    public string OrgName { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("logo_url")]
    public string? LogoUrl { get; set; }

    [Supabase.Postgrest.Attributes.Column("contact_name")]
    public string? ContactName { get; set; }

    [Supabase.Postgrest.Attributes.Column("contact_email")]
    public string? ContactEmail { get; set; }

    [Supabase.Postgrest.Attributes.Column("contact_phone")]
    public string? ContactPhone { get; set; }

    [Supabase.Postgrest.Attributes.Column("state")]
    public string? State { get; set; }

    [Supabase.Postgrest.Attributes.Column("verification_status")]
    public string VerificationStatus { get; set; } = default!;
}

