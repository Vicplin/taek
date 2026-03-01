namespace Taek.Api.Models.Db;

[Supabase.Postgrest.Attributes.Table("events")]
public class Event : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("organiser_id")]
    public string OrganiserId { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("title")]
    public string Title { get; set; } = default!;

    [Supabase.Postgrest.Attributes.Column("description")]
    public string? Description { get; set; }

    [Supabase.Postgrest.Attributes.Column("start_date")]
    public DateTime StartDate { get; set; }

    [Supabase.Postgrest.Attributes.Column("end_date")]
    public DateTime EndDate { get; set; }

    [Supabase.Postgrest.Attributes.Column("location")]
    public string? Location { get; set; }

    [Supabase.Postgrest.Attributes.Column("venue")]
    public string? Venue { get; set; }

    [Supabase.Postgrest.Attributes.Column("status")]
    public string Status { get; set; } = "draft"; // draft, published, completed, cancelled

    [Supabase.Postgrest.Attributes.Column("registration_deadline")]
    public DateTime? RegistrationDeadline { get; set; }

    [Supabase.Postgrest.Attributes.Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Supabase.Postgrest.Attributes.Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
