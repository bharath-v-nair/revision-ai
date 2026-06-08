using MediatR;
using RevisionAI.Application.Friends.Dtos;

namespace RevisionAI.Application.Friends.Queries.GetFriendRequests;

public class GetFriendRequestsQuery : IRequest<List<FriendRequestDto>>
{
    public Guid UserId { get; set; }
}