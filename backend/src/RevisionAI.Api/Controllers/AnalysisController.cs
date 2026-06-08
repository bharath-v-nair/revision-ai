using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Analysis.Commands.AnalyzeBatch;
using RevisionAI.Application.Analysis.Queries.GetDashboard;
using RevisionAI.Application.Analysis.Queries.GetQuestionHistory;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/analysis")]
[Authorize]
public class AnalysisController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalysisController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Endpoint 1: Analyze a batch of questions.
    /// </summary>
    [HttpPost("batch")]
    public async Task<ActionResult<AnalyzeBatchResponse>> AnalyzeBatch(
        [FromBody] AnalyzeBatchRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        AnalyzeBatchCommand command = new()
        {
            UserId = userId,
            QuestionIds = request.QuestionIds
        };

        AnalyzeBatchResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 2: Get user dashboard with overall stats.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<GetDashboardResponse>> GetDashboard(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetDashboardQuery query = new()
        {
            UserId = userId
        };

        GetDashboardResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 3: Get per-question attempt history.
    /// </summary>
    [HttpGet("question/{id:guid}/history")]
    public async Task<ActionResult<GetQuestionHistoryResponse>> GetQuestionHistory(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetQuestionHistoryQuery query = new()
        {
            UserId = userId,
            QuestionId = id
        };

        GetQuestionHistoryResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class AnalyzeBatchRequest
{
    public List<Guid> QuestionIds { get; set; } = new();
}