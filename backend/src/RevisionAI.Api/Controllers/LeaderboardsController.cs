using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Leaderboards.Dtos;
using RevisionAI.Application.Leaderboards.Queries.GetFriendsLeaderboard;
using RevisionAI.Application.Leaderboards.Queries.GetGlobalLeaderboard;
using RevisionAI.Application.Leaderboards.Queries.GetWeeklyLeaderboard;
using RevisionAI.Application.Leaderboards.Queries.SearchUsers;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/leaderboards")]
[Authorize]
public class LeaderboardsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LeaderboardsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get leaderboard for the current user's friends (plus themselves).
    /// </summary>
    [HttpGet("friends")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetFriendsLeaderboard(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetFriendsLeaderboardQuery query = new()
        {
            UserId = userId
        };

        List<LeaderboardEntryDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get global leaderboard, paginated by TotalXP descending.
    /// </summary>
    [HttpGet("global")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetGlobalLeaderboard(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        GetGlobalLeaderboardQuery query = new()
        {
            Page = page,
            PageSize = pageSize
        };

        List<LeaderboardEntryDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get weekly leaderboard by XP earned this week, paginated.
    /// </summary>
    [HttpGet("weekly")]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetWeeklyLeaderboard(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        GetWeeklyLeaderboardQuery query = new()
        {
            Page = page,
            PageSize = pageSize
        };

        List<LeaderboardEntryDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Search users by email or display name.
    /// </summary>
    [HttpGet("/api/users/search")]
    public async Task<ActionResult<List<UserSearchResultDto>>> SearchUsers(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        SearchUsersQuery query = new()
        {
            Q = q ?? string.Empty
        };

        List<UserSearchResultDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}