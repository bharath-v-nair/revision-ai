namespace RevisionAI.Application.QA;

public class QuestionReportDto
{
    public Guid ReportId { get; init; }
    public Guid QuestionId { get; init; }
    public int QuestionNumber { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string[] Issues { get; init; } = [];
    public string? Notes { get; init; }
    public DateTime UpdatedAt { get; init; }
}
