namespace RevisionAI.Domain.Entities;

public class UserStreak
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateOnly? LastActiveDate { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}