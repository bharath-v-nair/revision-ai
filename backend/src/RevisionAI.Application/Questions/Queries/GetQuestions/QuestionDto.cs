namespace RevisionAI.Application.Questions.Queries.GetQuestions;

public class QuestionDto
{
    public Guid Id { get; set; }
    public int QuestionNumber { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public bool HasMedia { get; set; }
    public int SourcePage { get; set; }
    public string? SubjectName { get; set; }
    public string? ChapterTitle { get; set; }
}