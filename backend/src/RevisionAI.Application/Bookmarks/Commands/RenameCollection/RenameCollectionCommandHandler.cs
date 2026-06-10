using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Commands.RenameCollection;

public class RenameCollectionCommandHandler : IRequestHandler<RenameCollectionCommand>
{
    private readonly IAppDbContext _context;

    public RenameCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RenameCollectionCommand request, CancellationToken cancellationToken)
    {
        BookmarkCollection? collection = await _context.BookmarkCollections
            .FirstOrDefaultAsync(
                c => c.Id == request.CollectionId && c.UserId == request.UserId,
                cancellationToken);

        if (collection is null)
        {
            throw new ValidationException(
                "Collection not found.",
                [new FluentValidation.Results.ValidationFailure("CollectionId", "Collection not found.")]);
        }

        collection.Name = request.Name.Trim();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
