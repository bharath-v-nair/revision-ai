using MediatR;

namespace RevisionAI.Application.Bookmarks.Commands.AddBookmarkItem;

public class AddBookmarkItemCommand : IRequest<AddBookmarkItemResponse>
{
    public Guid UserId { get; set; }
    public Guid CollectionId { get; set; }
    public Guid QuestionId { get; set; }
}