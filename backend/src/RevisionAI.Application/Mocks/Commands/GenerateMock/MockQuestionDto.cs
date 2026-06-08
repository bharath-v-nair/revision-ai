namespace RevisionAI.Application.Mocks.Commands.GenerateMock;

public class MockQuestionDto
{
    public int DisplayOrder { get; set; }
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
}