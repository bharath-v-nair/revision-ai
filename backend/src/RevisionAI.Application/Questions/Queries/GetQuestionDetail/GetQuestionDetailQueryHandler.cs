using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Questions.Queries.GetQuestionDetail;

public class GetQuestionDetailQueryHandler : IRequestHandler<GetQuestionDetailQuery, GetQuestionDetailResponse?>
{
    private readonly IAppDbContext _context;

    public GetQuestionDetailQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetQuestionDetailResponse?> Handle(GetQuestionDetailQuery request, CancellationToken cancellationToken)
    {
        QuestionDetailDto? question = await _context.Questions
            .AsNoTracking()
            .Where(q => q.Id == request.Id)
            .Select(q => new QuestionDetailDto
            {
                Id = q.Id,
                QuestionNumber = q.QuestionNumber,
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectOption = q.CorrectOption,
                Explanation = q.Explanation,
                HasMedia = q.HasMedia,
                SourcePage = q.SourcePage,
                SubjectName = q.Subject.Name,
                ChapterTitle = q.Chapter.Title,
                Media = q.Media.Select(m => new MediaDto
                {
                    Id = m.Id,
                    MediaType = m.MediaType,
                    Description = m.Description,
                    BlobUrl = m.BlobUrl,
                    PageNumber = m.PageNumber,
                    IsExplanation = m.IsExplanation
                }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (question is null)
        {
            return null;
        }

        return new GetQuestionDetailResponse { Data = question };
    }
}