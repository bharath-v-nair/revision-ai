using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Commands.AddBookmarkItem;

public class AddBookmarkItemCommandHandler : IRequestHandler<AddBookmarkItemCommand, AddBookmarkItemResponse>
{
    private readonly IAppDbContext _context;

    public AddBookmarkItemCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AddBookmarkItemResponse> Handle(AddBookmarkItemCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify collection exists and belongs to user
        BookmarkCollection? collection = await _context.BookmarkCollections
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.CollectionId, cancellationToken);

        if (collection is null || collection.UserId != request.UserId)
        {
            throw new ValidationException(
                "Bookmark collection not found.",
                [new FluentValidation.Results.ValidationFailure("CollectionId", "Bookmark collection not found.")]);
        }

        // 2. Verify question exists
        Question? question = await _context.Questions
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == request.QuestionId, cancellationToken);

        if (question is null)
        {
            throw new ValidationException(
                "Question not found.",
                [new FluentValidation.Results.ValidationFailure("QuestionId", "Question not found.")]);
        }

        // 3. Check for duplicate (InMemory doesn't enforce UNIQUE constraints)
        bool alreadyExists = await _context.BookmarkItems
            .AnyAsync(i => i.CollectionId == request.CollectionId && i.QuestionId == request.QuestionId, cancellationToken);

        if (alreadyExists)
        {
            throw new ValidationException(
                "This question is already bookmarked in this collection.",
                [new FluentValidation.Results.ValidationFailure("QuestionId", "Duplicate bookmark.")]);
        }

        // 4. Create bookmark item
        BookmarkItem item = new()
        {
            Id = Guid.NewGuid(),
            CollectionId = request.CollectionId,
            QuestionId = request.QuestionId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Add(item);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsDuplicateConstraintViolation(ex))
        {
            throw new ValidationException(
                "This question is already bookmarked in this collection.",
                [new FluentValidation.Results.ValidationFailure("QuestionId", "Duplicate bookmark.")]);
        }

        return new AddBookmarkItemResponse
        {
            Id = item.Id,
            QuestionId = request.QuestionId,
            QuestionText = question.QuestionText,
            CreatedAt = item.CreatedAt
        };
    }

    private static bool IsDuplicateConstraintViolation(DbUpdateException ex)
    {
        string? message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase);
    }
}