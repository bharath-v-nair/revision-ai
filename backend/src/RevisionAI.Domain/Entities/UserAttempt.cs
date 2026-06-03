namespace RevisionAI.Domain.Entities;

public class UserAttempt
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid QuestionId { get; set; }
    public char SelectedOption { get; set; }
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }
    public string? Confidence { get; set; }
    public int AttemptNumber { get; set; }
    public string SessionType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Question Question { get; set; } = null!;
}