namespace RevisionAI.Application.Mocks.Commands.CompleteMock;

public class CompleteMockResponse
{
    public Guid MockSessionId { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredCount { get; set; }
    public int CorrectCount { get; set; }
    public int SkippedCount { get; set; }
    public int Score { get; set; }
    public double? TimeTakenSeconds { get; set; }
}