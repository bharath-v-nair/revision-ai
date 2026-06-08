namespace RevisionAI.Application.Mocks.Queries.GetMockResults;

public class MockResultQuestionDto
{
    public int DisplayOrder { get; set; }
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char? SelectedOption { get; set; }
    public bool? IsCorrect { get; set; }
    public char CorrectOption { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public int? TimeTakenMs { get; set; }
}