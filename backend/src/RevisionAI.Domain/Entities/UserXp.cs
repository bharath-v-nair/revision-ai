namespace RevisionAI.Domain.Entities;

public class UserXp
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}