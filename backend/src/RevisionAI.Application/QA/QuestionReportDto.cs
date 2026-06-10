namespace RevisionAI.Application.QA;

public class QuestionReportDto
{
    public Guid ReportId { get; init; }
    public Guid QuestionId { get; init; }
    public int QuestionNumber { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string OptionA { get; init; } = string.Empty;
    public string OptionB { get; init; } = string.Empty;
    public string OptionC { get; init; } = string.Empty;
    public string OptionD { get; init; } = string.Empty;
    public char CorrectOption { get; init; }
    public string Explanation { get; init; } = string.Empty;
    public int SourcePage { get; init; }
    public bool HasMedia { get; init; }
    public string SubjectName { get; init; } = string.Empty;
    public string ChapterTitle { get; init; } = string.Empty;
    public int ChapterNumber { get; init; }
    public string[] Issues { get; init; } = [];
    public string? Notes { get; init; }
    public DateTime UpdatedAt { get; init; }
}
