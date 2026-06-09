using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Gamification.Commands.TickStreak;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Application.Gamification.Queries.GetStreak;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/streaks")]
[Authorize]
public class StreaksController : ControllerBase
{
    private readonly IMediator _mediator;

    public StreaksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get current user streak info.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<StreakDto>> GetStreak(CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetStreakQuery query = new()
        {
            UserId = userId
        };

        StreakDto result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Increment streak when user answers a question (background-callable).
    /// </summary>
    [HttpPost("tick")]
    public async Task<ActionResult<StreakDto>> TickStreak(CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        TickStreakCommand command = new()
        {
            UserId = userId
        };

        StreakDto result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}