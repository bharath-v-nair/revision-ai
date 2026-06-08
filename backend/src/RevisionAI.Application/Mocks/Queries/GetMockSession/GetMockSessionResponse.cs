using RevisionAI.Application.Mocks.Commands.GenerateMock;

namespace RevisionAI.Application.Mocks.Queries.GetMockSession;

public class GetMockSessionResponse
{
    public Guid MockSessionId { get; set; }
    public string Config { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public DateTime StartedAt { get; set; }
    public bool IsCompleted { get; set; }
    public int? Score { get; set; }
    public List<MockQuestionDto> Questions { get; set; } = new();
}