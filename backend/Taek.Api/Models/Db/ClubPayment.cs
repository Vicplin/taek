using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Taek.Api.Models.Db;

[Table("club_payments")]
public class ClubPayment : BaseModel
{
    [PrimaryKey("id", false)]
    public string Id { get; set; } = default!;

    [Column("club_id")]
    public string ClubId { get; set; } = default!;

    [Reference(typeof(Club))]
    public Club? Club { get; set; }

    [Column("tournament_id")]
    public string TournamentId { get; set; } = default!;

    [Reference(typeof(Tournament))]
    public Tournament? Tournament { get; set; }

    [Column("receipt_url")]
    public string? ReceiptUrl { get; set; }

    [Column("total_amount")]
    public decimal? TotalAmount { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
