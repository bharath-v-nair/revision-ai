using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Commands.RemoveBookmarkItem;

public class RemoveBookmarkItemCommandHandler : IRequestHandler<RemoveBookmarkItemCommand>
{
    private readonly IAppDbContext _context;

    public RemoveBookmarkItemCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveBookmarkItemCommand request, CancellationToken cancellationToken)
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

        // Find the bookmark item
        BookmarkItem? item = await _context.BookmarkItems
            .FirstOrDefaultAsync(
                i => i.CollectionId == request.CollectionId && i.QuestionId == request.QuestionId,
                cancellationToken);

        if (item is null)
        {
            throw new ValidationException(
                "Bookmark item not found.",
                [new FluentValidation.Results.ValidationFailure("QuestionId", "Bookmark item not found.")]);
        }

        _context.BookmarkItems.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
    }
}