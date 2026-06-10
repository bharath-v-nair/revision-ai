using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Commands.DeleteCollection;

public class DeleteCollectionCommandHandler : IRequestHandler<DeleteCollectionCommand>
{
    private readonly IAppDbContext _context;

    public DeleteCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteCollectionCommand request, CancellationToken cancellationToken)
    {
        BookmarkCollection? collection = await _context.BookmarkCollections
            .Include(c => c.Items)
            .FirstOrDefaultAsync(
                c => c.Id == request.CollectionId && c.UserId == request.UserId,
                cancellationToken);

        if (collection is null)
        {
            throw new ValidationException(
                "Collection not found.",
                [new FluentValidation.Results.ValidationFailure("CollectionId", "Collection not found.")]);
        }

        _context.BookmarkCollections.Remove(collection);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
