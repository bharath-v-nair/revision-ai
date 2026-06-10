using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.QA.Queries.GetSubjectReports;

public class GetSubjectReportsQueryHandler : IRequestHandler<GetSubjectReportsQuery, SubjectReportSummaryDto>
{
    private readonly IAppDbContext _context;

    public GetSubjectReportsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<SubjectReportSummaryDto> Handle(GetSubjectReportsQuery request, CancellationToken cancellationToken)
    {
        string subjectName = await _context.Subjects
            .AsNoTracking()
            .Where(s => s.Id == request.SubjectId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        // Count flagged questions per chapter for this subject
        List<ChapterSummaryDto> chapters = await _context.Chapters
            .AsNoTracking()
            .Where(c => c.SubjectId == request.SubjectId)
            .OrderBy(c => c.ChapterNumber)
            .Select(c => new ChapterSummaryDto
            {
                ChapterId = c.Id,
                ChapterNumber = c.ChapterNumber,
                Title = c.Title,
                FlaggedCount = _context.QuestionReports.Count(r => r.Question.ChapterId == c.Id)
            })
            .ToListAsync(cancellationToken);

        return new SubjectReportSummaryDto
        {
            SubjectId = request.SubjectId,
            SubjectName = subjectName,
            TotalFlagged = chapters.Sum(c => c.FlaggedCount),
            Chapters = chapters
        };
    }
}
