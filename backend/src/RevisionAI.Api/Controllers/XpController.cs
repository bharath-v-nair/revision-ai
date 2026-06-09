using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Application.Gamification.Queries.GetXpSummary;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/xp")]
[Authorize]
public class XpController : ControllerBase
{
    private readonly IMediator _mediator;

    public XpController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get XP summary: total, level, progress to next level, recent transactions.
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<XpSummaryDto>> GetXpSummary(CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetXpSummaryQuery query = new()
        {
            UserId = userId
        };

        XpSummaryDto result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}