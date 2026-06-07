using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Questions.Queries.GetQuestions;

public class GetQuestionsQueryHandler : IRequestHandler<GetQuestionsQuery, GetQuestionsResponse?>
{
    private readonly IAppDbContext _context;

    public GetQuestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetQuestionsResponse?> Handle(GetQuestionsQuery request, CancellationToken cancellationToken)
    {
        Subject? subject = await _context.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Slug == request.SubjectSlug, cancellationToken);

        if (subject is null)
        {
            return null;
        }

        IQueryable<Question> query = _context.Questions
            .AsNoTracking()
            .Where(q => q.SubjectId == subject.Id);

        if (request.ChapterNumber.HasValue)
        {
            query = query.Where(q => q.Chapter.ChapterNumber == request.ChapterNumber.Value);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 100);

        List<QuestionDto> questions = await query
            .OrderBy(q => q.QuestionNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new QuestionDto
            {
                Id = q.Id,
                QuestionNumber = q.QuestionNumber,
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                HasMedia = q.HasMedia,
                SourcePage = q.SourcePage,
                SubjectName = q.Subject.Name,
                ChapterTitle = q.Chapter.Title
            })
            .ToListAsync(cancellationToken);

        return new GetQuestionsResponse
        {
            Data = questions,
            Meta = new MetaDto
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                HasNext = (page * pageSize) < totalCount
            }
        };
    }
}