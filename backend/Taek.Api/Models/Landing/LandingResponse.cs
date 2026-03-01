namespace Taek.Api.Models.Landing;

public class LandingStats
{
    public int ActivePlayers { get; set; }
    public int Tournaments { get; set; }
    public int PartnerClubs { get; set; }
}

public class LandingData
{
    public IEnumerable<Db.Tournament> FeaturedTournaments { get; set; } = [];
    public LandingStats Stats { get; set; } = new();
}
