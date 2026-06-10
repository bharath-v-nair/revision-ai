using RevisionAI.Application.QA;

namespace RevisionAI.Application.QA.Queries.GetChapterReports;

public class ChapterReportsDto
{
    public Guid ChapterId { get; init; }
    public string ChapterTitle { get; init; } = string.Empty;
    public int FlaggedCount { get; init; }
    public List<QuestionReportDto> Reports { get; init; } = [];
}
