using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Questions.Queries.GetQuestionDetail;

public class GetQuestionMediaQueryHandler : IRequestHandler<GetQuestionMediaQuery, GetQuestionMediaResponse?>
{
    private readonly IAppDbContext _context;

    public GetQuestionMediaQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetQuestionMediaResponse?> Handle(GetQuestionMediaQuery request, CancellationToken cancellationToken)
    {
        bool questionExists = await _context.Questions
            .AsNoTracking()
            .AnyAsync(q => q.Id == request.Id, cancellationToken);

        if (!questionExists)
        {
            return null;
        }

        List<MediaDto> media = await _context.QuestionMedia
            .AsNoTracking()
            .Where(m => m.QuestionId == request.Id)
            .Select(m => new MediaDto
            {
                Id = m.Id,
                MediaType = m.MediaType,
                Description = m.Description,
                BlobUrl = m.BlobUrl,
                PageNumber = m.PageNumber,
                IsExplanation = m.IsExplanation
            })
            .ToListAsync(cancellationToken);

        return new GetQuestionMediaResponse { Data = media };
    }
}