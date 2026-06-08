using MediatR;

namespace RevisionAI.Application.Bookmarks.Queries.GetCollections;

public class GetCollectionsQuery : IRequest<List<GetCollectionsResponse>>
{
    public Guid UserId { get; set; }
}