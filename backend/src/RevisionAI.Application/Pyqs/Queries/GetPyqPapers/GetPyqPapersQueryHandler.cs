using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqPapers;

public class GetPyqPapersQueryHandler : IRequestHandler<GetPyqPapersQuery, GetPyqPapersResponse?>
{
    private readonly IAppDbContext _context;

    public GetPyqPapersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetPyqPapersResponse?> Handle(GetPyqPapersQuery request, CancellationToken cancellationToken)
    {
        // Confirm the subject exists and actually has PYQs before returning an (empty) list.
        // Slugs are stored canonically lowercase (see Subject seeding), so an exact
        // match mirrors the existing GetSubjectChapters / GetQuestions handlers.
        bool subjectExists = await _context.Subjects
            .AsNoTracking()
            .AnyAsync(s => s.Slug == request.SubjectSlug, cancellationToken);

        if (!subjectExists)
        {
            return null;
        }

        // Group PYQs by exam paper (ExamName) + its chapter. Year/type are parsed in memory.
        var grouped = await _context.Questions
            .AsNoTracking()
            .Where(q => q.IsPYQ && q.Subject.Slug == request.SubjectSlug)
            .GroupBy(q => new { q.ExamName, q.Chapter.ChapterNumber })
            .Select(g => new
            {
                g.Key.ExamName,
                g.Key.ChapterNumber,
                QuestionCount = g.Count()
            })
            .ToListAsync(cancellationToken);

        var papers = grouped
            .Select(g =>
            {
                (string examType, int examYear) = ExamNameParser.Parse(g.ExamName);
                return new PyqPaperDto
                {
                    ExamName = g.ExamName ?? string.Empty,
                    ExamType = examType,
                    ExamYear = examYear,
                    QuestionCount = g.QuestionCount,
                    ChapterNumber = g.ChapterNumber
                };
            })
            .OrderByDescending(p => p.ExamYear)
            .ThenBy(p => p.ExamName)
            .ToList();

        return new GetPyqPapersResponse { Data = papers };
    }
}
