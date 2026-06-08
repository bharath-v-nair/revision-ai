using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Friends.Commands.AcceptRequest;
using RevisionAI.Application.Friends.Commands.DeclineRequest;
using RevisionAI.Application.Friends.Commands.SendRequest;
using RevisionAI.Application.Friends.Commands.Unfriend;
using RevisionAI.Application.Friends.Dtos;
using RevisionAI.Application.Friends.Queries.GetFriendRequests;
using RevisionAI.Application.Friends.Queries.GetFriends;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/friends")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FriendsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Send a friend request to a user by email.
    /// </summary>
    [HttpPost("request")]
    public async Task<ActionResult<FriendRequestDto>> SendRequest(
        [FromBody] SendFriendRequest apiRequest,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        SendRequestCommand command = new()
        {
            RequesterId = userId,
            Email = apiRequest.Email
        };

        FriendRequestDto result = await _mediator.Send(command, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>
    /// Get pending incoming friend requests.
    /// </summary>
    [HttpGet("requests")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetFriendRequests(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetFriendRequestsQuery query = new()
        {
            UserId = userId
        };

        List<FriendRequestDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Accept a pending friend request.
    /// </summary>
    [HttpPost("requests/{id:guid}/accept")]
    public async Task<IActionResult> AcceptRequest(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        AcceptRequestCommand command = new()
        {
            FriendshipId = id,
            UserId = userId
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Decline a pending friend request.
    /// </summary>
    [HttpPost("requests/{id:guid}/decline")]
    public async Task<IActionResult> DeclineRequest(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        DeclineRequestCommand command = new()
        {
            FriendshipId = id,
            UserId = userId
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Get list of accepted friends.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FriendDto>>> GetFriends(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetFriendsQuery query = new()
        {
            UserId = userId
        };

        List<FriendDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Unfriend — removes both sides of the friendship.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Unfriend(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        UnfriendCommand command = new()
        {
            FriendshipId = id,
            UserId = userId
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class SendFriendRequest
{
    public string Email { get; set; } = string.Empty;
}