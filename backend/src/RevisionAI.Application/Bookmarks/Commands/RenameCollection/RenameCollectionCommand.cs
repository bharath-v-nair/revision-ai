using MediatR;

namespace RevisionAI.Application.Bookmarks.Commands.RenameCollection;

public class RenameCollectionCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid CollectionId { get; set; }
    public string Name { get; set; } = string.Empty;
}
