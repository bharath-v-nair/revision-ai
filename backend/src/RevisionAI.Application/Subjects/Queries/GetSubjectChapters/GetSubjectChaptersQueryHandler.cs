using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Subjects.Queries.GetSubjectChapters;

public class GetSubjectChaptersQueryHandler : IRequestHandler<GetSubjectChaptersQuery, GetSubjectChaptersResponse?>
{
    private readonly IAppDbContext _context;

    public GetSubjectChaptersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetSubjectChaptersResponse?> Handle(GetSubjectChaptersQuery request, CancellationToken cancellationToken)
    {
        Subject? subject = await _context.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Slug == request.SubjectSlug, cancellationToken);

        if (subject is null)
        {
            return null;
        }

        List<ChapterDto> chapters = await _context.Chapters
            .AsNoTracking()
            .Where(c => c.SubjectId == subject.Id)
            .OrderBy(c => c.ChapterNumber)
            .Select(c => new ChapterDto
            {
                Id = c.Id,
                ChapterNumber = c.ChapterNumber,
                Title = c.Title,
                StartPage = c.StartPage,
                EndPage = c.EndPage,
                QuestionCount = c.Questions.Count
            })
            .ToListAsync(cancellationToken);

        return new GetSubjectChaptersResponse { Data = chapters };
    }
}