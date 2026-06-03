namespace RevisionAI.Domain.Entities;

public class MockSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string MockConfig { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public int? Score { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<MockSessionAnswer> Answers { get; set; } = new List<MockSessionAnswer>();
}