using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.QA.Queries.GetAllSubjectReportSummaries;

public class GetAllSubjectReportSummariesQueryHandler : IRequestHandler<GetAllSubjectReportSummariesQuery, List<SubjectReportIndexDto>>
{
    private readonly IAppDbContext _context;

    public GetAllSubjectReportSummariesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public Task<List<SubjectReportIndexDto>> Handle(GetAllSubjectReportSummariesQuery request, CancellationToken cancellationToken) =>
        _context.Subjects
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SubjectReportIndexDto
            {
                SubjectId = s.Id,
                SubjectName = s.Name,
                SubjectSlug = s.Slug,
                TotalFlagged = _context.QuestionReports.Count(r => r.Question.SubjectId == s.Id)
            })
            .ToListAsync(cancellationToken);
}
