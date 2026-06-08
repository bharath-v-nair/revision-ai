namespace RevisionAI.Application.Mocks.Queries.GetMockResults;

public class GetMockResultsResponse
{
    public Guid MockSessionId { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int IncorrectCount { get; set; }
    public int SkippedCount { get; set; }
    public int Score { get; set; }
    public double? TimeTakenSeconds { get; set; }
    public List<MockResultQuestionDto> Questions { get; set; } = new();
}