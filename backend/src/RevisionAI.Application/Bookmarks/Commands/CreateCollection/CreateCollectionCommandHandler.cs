using MediatR;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Bookmarks.Commands.CreateCollection;

public class CreateCollectionCommandHandler : IRequestHandler<CreateCollectionCommand, CreateCollectionResponse>
{
    private readonly IAppDbContext _context;

    public CreateCollectionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<CreateCollectionResponse> Handle(CreateCollectionCommand request, CancellationToken cancellationToken)
    {
        BookmarkCollection collection = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = request.Name,
            Icon = request.Icon,
            CreatedAt = DateTime.UtcNow
        };

        _context.Add(collection);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateCollectionResponse
        {
            Id = collection.Id,
            Name = collection.Name,
            Icon = collection.Icon,
            ItemCount = 0,
            CreatedAt = collection.CreatedAt
        };
    }
}