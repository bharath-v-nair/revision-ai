namespace RevisionAI.Domain.Entities;

public class MockSessionAnswer
{
    public Guid Id { get; set; }
    public Guid MockSessionId { get; set; }
    public Guid QuestionId { get; set; }
    public char? SelectedOption { get; set; }
    public bool? IsCorrect { get; set; }
    public int? TimeTakenMs { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation
    public MockSession MockSession { get; set; } = null!;
    public Question Question { get; set; } = null!;
}