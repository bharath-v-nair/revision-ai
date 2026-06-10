using MediatR;

namespace RevisionAI.Application.Bookmarks.Commands.DeleteCollection;

public class DeleteCollectionCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid CollectionId { get; set; }
}
