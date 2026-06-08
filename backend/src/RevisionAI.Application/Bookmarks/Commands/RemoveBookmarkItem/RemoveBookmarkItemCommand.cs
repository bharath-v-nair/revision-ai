using MediatR;

namespace RevisionAI.Application.Bookmarks.Commands.RemoveBookmarkItem;

public class RemoveBookmarkItemCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid CollectionId { get; set; }
    public Guid QuestionId { get; set; }
}