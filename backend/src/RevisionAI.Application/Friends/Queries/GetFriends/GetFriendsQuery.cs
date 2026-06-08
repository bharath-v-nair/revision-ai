using MediatR;
using RevisionAI.Application.Friends.Dtos;

namespace RevisionAI.Application.Friends.Queries.GetFriends;

public class GetFriendsQuery : IRequest<List<FriendDto>>
{
    public Guid UserId { get; set; }
}