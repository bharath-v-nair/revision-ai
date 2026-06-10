namespace RevisionAI.Application.QA.Queries.GetSubjectReports;

public class SubjectReportSummaryDto
{
    public Guid SubjectId { get; init; }
    public string SubjectName { get; init; } = string.Empty;
    public int TotalFlagged { get; init; }
    public List<ChapterSummaryDto> Chapters { get; init; } = [];
}

public class ChapterSummaryDto
{
    public Guid ChapterId { get; init; }
    public int ChapterNumber { get; init; }
    public string Title { get; init; } = string.Empty;
    public int FlaggedCount { get; init; }
}
