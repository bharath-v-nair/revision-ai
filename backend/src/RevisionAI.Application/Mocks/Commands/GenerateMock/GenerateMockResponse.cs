namespace RevisionAI.Application.Mocks.Commands.GenerateMock;

public class GenerateMockResponse
{
    public Guid MockSessionId { get; set; }
    public int TotalQuestions { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public List<MockQuestionDto> Questions { get; set; } = new();
}