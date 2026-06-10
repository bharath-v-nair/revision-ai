using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.QA;

namespace RevisionAI.Application.QA.Queries.GetChapterReports;

public class GetChapterReportsQueryHandler : IRequestHandler<GetChapterReportsQuery, ChapterReportsDto>
{
    private readonly IAppDbContext _context;

    public GetChapterReportsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ChapterReportsDto> Handle(GetChapterReportsQuery request, CancellationToken cancellationToken)
    {
        string chapterTitle = await _context.Chapters
            .AsNoTracking()
            .Where(c => c.Id == request.ChapterId)
            .Select(c => c.Title)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        List<QuestionReportDto> reports = await _context.QuestionReports
            .AsNoTracking()
            .Where(r => r.Question.ChapterId == request.ChapterId)
            .OrderBy(r => r.Question.QuestionNumber)
            .Select(r => new QuestionReportDto
            {
                ReportId = r.Id,
                QuestionId = r.QuestionId,
                QuestionNumber = r.Question.QuestionNumber,
                QuestionText = r.Question.QuestionText,
                Issues = r.Issues,
                Notes = r.Notes,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new ChapterReportsDto
        {
            ChapterId = request.ChapterId,
            ChapterTitle = chapterTitle,
            FlaggedCount = reports.Count,
            Reports = reports
        };
    }
}
