using MediatR;

namespace RevisionAI.Application.Bookmarks.Commands.CreateCollection;

public class CreateCollectionCommand : IRequest<CreateCollectionResponse>
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
}