using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.SpacedRepetition.Commands.ReviewQuestion;
using RevisionAI.Application.SpacedRepetition.Queries.GetDueQuestions;
using RevisionAI.Application.SpacedRepetition.Queries.GetSpacedRepetitionStats;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/spaced-repetition")]
[Authorize]
public class SpacedRepetitionController : ControllerBase
{
    private readonly IMediator _mediator;

    public SpacedRepetitionController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Endpoint 1: Get due questions for spaced repetition review.
    /// </summary>
    [HttpGet("due")]
    public async Task<ActionResult<GetDueQuestionsResponse>> GetDueQuestions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Guid userId = GetUserId();

        GetDueQuestionsQuery query = new()
        {
            UserId = userId,
            Page = page,
            PageSize = pageSize
        };

        GetDueQuestionsResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 2: Review a question via spaced repetition.
    /// </summary>
    [HttpPost("{questionId:guid}/review")]
    public async Task<ActionResult<ReviewQuestionResponse>> ReviewQuestion(
        Guid questionId,
        [FromBody] ReviewQuestionRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        ReviewQuestionCommand command = new()
        {
            QuestionId = questionId,
            UserId = userId,
            SelectedOption = request.SelectedOption,
            TimeTakenMs = request.TimeTakenMs
        };

        ReviewQuestionResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 3: Get spaced repetition stats.
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<GetSpacedRepetitionStatsResponse>> GetStats(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetSpacedRepetitionStatsQuery query = new()
        {
            UserId = userId
        };

        GetSpacedRepetitionStatsResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class ReviewQuestionRequest
{
    public char SelectedOption { get; set; }
    public int TimeTakenMs { get; set; }
}