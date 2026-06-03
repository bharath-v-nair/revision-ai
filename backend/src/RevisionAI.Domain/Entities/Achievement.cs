namespace RevisionAI.Domain.Entities;

public class Achievement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string AchievementKey { get; set; } = string.Empty;
    public DateTime UnlockedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}