using MediatR;

namespace RevisionAI.Application.QA.Queries.GetSubjectReports;

public class GetSubjectReportsQuery : IRequest<SubjectReportSummaryDto>
{
    public Guid SubjectId { get; init; }
}
