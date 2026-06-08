namespace RevisionAI.Application.Mocks.Commands.SubmitMockAnswers;

public class SubmitMockAnswersResponse
{
    public List<AnswerResultDto> Results { get; set; } = new();
}

public class AnswerResultDto
{
    public Guid QuestionId { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsCorrect { get; set; }
    public char CorrectOption { get; set; }
    public string Explanation { get; set; } = string.Empty;
}