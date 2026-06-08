using MediatR;

namespace RevisionAI.Application.Bookmarks.Queries.GetCollectionItems;

public class GetCollectionItemsQuery : IRequest<GetCollectionItemsResponse>
{
    public Guid UserId { get; set; }
    public Guid CollectionId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}