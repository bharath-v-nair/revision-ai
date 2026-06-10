using MediatR;

namespace RevisionAI.Application.QA.Queries.GetAllSubjectReportSummaries;

public class GetAllSubjectReportSummariesQuery : IRequest<List<SubjectReportIndexDto>>
{
}
