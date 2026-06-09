using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Gamification.Commands.CheckAchievements;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Application.Gamification.Queries.GetAchievementDetail;
using RevisionAI.Application.Gamification.Queries.GetAchievements;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/achievements")]
[Authorize]
public class AchievementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AchievementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// List all achievements for current user (locked + unlocked) with progress.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AchievementDto>>> GetAchievements(CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetAchievementsQuery query = new()
        {
            UserId = userId
        };

        List<AchievementDto> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get single achievement detail with progress.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AchievementDto>> GetAchievementDetail(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetAchievementDetailQuery query = new()
        {
            UserId = userId,
            AchievementId = id
        };

        AchievementDto? result = await _mediator.Send(query, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Scan user activity and unlock any achievements whose conditions are met.
    /// </summary>
    [HttpPost("check")]
    public async Task<ActionResult<CheckAchievementsResponse>> CheckAchievements(CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        CheckAchievementsCommand command = new()
        {
            UserId = userId
        };

        CheckAchievementsResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}