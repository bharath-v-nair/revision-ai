namespace RevisionAI.Application.Mocks.Queries.GetMockHistory;

public class MockHistoryDto
{
    public Guid MockSessionId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int QuestionCount { get; set; }
    public int? Score { get; set; }
    public double? TimeTakenSeconds { get; set; }
}