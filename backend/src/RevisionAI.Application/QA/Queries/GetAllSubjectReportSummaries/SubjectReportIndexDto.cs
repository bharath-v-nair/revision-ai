namespace RevisionAI.Application.QA.Queries.GetAllSubjectReportSummaries;

public class SubjectReportIndexDto
{
    public Guid SubjectId { get; init; }
    public string SubjectName { get; init; } = string.Empty;
    public string SubjectSlug { get; init; } = string.Empty;
    public int TotalFlagged { get; init; }
}
