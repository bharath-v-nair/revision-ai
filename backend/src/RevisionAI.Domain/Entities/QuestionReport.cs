namespace RevisionAI.Domain.Entities;

public class QuestionReport
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string[] Issues { get; set; } = [];
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
