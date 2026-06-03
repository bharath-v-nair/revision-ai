namespace RevisionAI.Domain.Entities;

public class QuestionSchedule
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid QuestionId { get; set; }
    public double EaseFactor { get; set; }
    public int Interval { get; set; }
    public int Repetitions { get; set; }
    public DateTime NextReviewDate { get; set; }
    public DateTime? LastReviewedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Question Question { get; set; } = null!;
}