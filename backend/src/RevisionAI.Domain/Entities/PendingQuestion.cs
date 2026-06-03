namespace RevisionAI.Domain.Entities;

public class PendingQuestion
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid QuestionId { get; set; }
    public bool IsAnswered { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Question Question { get; set; } = null!;
}