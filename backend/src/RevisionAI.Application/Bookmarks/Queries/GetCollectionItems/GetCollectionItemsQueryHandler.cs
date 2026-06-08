using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Questions.Queries.GetQuestions;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Queries.GetCollectionItems;

public class GetCollectionItemsQueryHandler : IRequestHandler<GetCollectionItemsQuery, GetCollectionItemsResponse>
{
    private readonly IAppDbContext _context;

    public GetCollectionItemsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetCollectionItemsResponse> Handle(GetCollectionItemsQuery request, CancellationToken cancellationToken)
    {
        // Verify collection exists and belongs to user
        BookmarkCollection? collection = await _context.BookmarkCollections
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CollectionId, cancellationToken);

        if (collection is null || collection.UserId != request.UserId)
        {
            throw new ValidationException(
                "Bookmark collection not found.",
                [new FluentValidation.Results.ValidationFailure("CollectionId", "Bookmark collection not found.")]);
        }

        int totalCount = await _context.BookmarkItems
            .AsNoTracking()
            .Where(i => i.CollectionId == request.CollectionId)
            .CountAsync(cancellationToken);

        List<QuestionDto> questions = await _context.BookmarkItems
            .AsNoTracking()
            .Where(i => i.CollectionId == request.CollectionId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(i => new QuestionDto
            {
                Id = i.Question.Id,
                QuestionNumber = i.Question.QuestionNumber,
                QuestionText = i.Question.QuestionText,
                OptionA = i.Question.OptionA,
                OptionB = i.Question.OptionB,
                OptionC = i.Question.OptionC,
                OptionD = i.Question.OptionD,
                HasMedia = i.Question.HasMedia,
                SourcePage = i.Question.SourcePage,
                SubjectName = i.Question.Subject != null ? i.Question.Subject.Name : null,
                ChapterTitle = i.Question.Chapter != null ? i.Question.Chapter.Title : null
            })
            .ToListAsync(cancellationToken);

        return new GetCollectionItemsResponse
        {
            Data = questions,
            Meta = new MetaDto
            {
                Page = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount,
                HasNext = request.Page * request.PageSize < totalCount
            }
        };
    }
}