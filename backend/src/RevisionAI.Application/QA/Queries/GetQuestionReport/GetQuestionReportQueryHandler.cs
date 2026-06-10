using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.QA;

namespace RevisionAI.Application.QA.Queries.GetQuestionReport;

public class GetQuestionReportQueryHandler : IRequestHandler<GetQuestionReportQuery, QuestionReportDto?>
{
    private readonly IAppDbContext _context;

    public GetQuestionReportQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public Task<QuestionReportDto?> Handle(GetQuestionReportQuery request, CancellationToken cancellationToken) =>
        _context.QuestionReports
            .AsNoTracking()
            .Where(r => r.QuestionId == request.QuestionId && r.UserId == request.UserId)
            .Select(r => new QuestionReportDto
            {
                ReportId = r.Id,
                QuestionId = r.QuestionId,
                Issues = r.Issues,
                Notes = r.Notes,
                UpdatedAt = r.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
}
