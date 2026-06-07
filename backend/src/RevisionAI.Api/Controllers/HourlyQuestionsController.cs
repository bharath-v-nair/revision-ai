using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.HourlyQuestions.Commands.AnswerQuestion;
using RevisionAI.Application.HourlyQuestions.Queries.GetHourlyHistory;
using RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/hourly-questions")]
[Authorize]
public class HourlyQuestionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public HourlyQuestionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetPendingQuestionsResponse>> GetPendingQuestions(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetPendingQuestionsQuery query = new()
        {
            UserId = userId
        };

        GetPendingQuestionsResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    [HttpPost("{pendingQuestionId:guid}/answer")]
    public async Task<ActionResult<AnswerQuestionResponse>> AnswerQuestion(
        Guid pendingQuestionId,
        [FromBody] AnswerQuestionRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        AnswerQuestionCommand command = new()
        {
            PendingQuestionId = pendingQuestionId,
            UserId = userId,
            SelectedOption = request.SelectedOption
        };

        AnswerQuestionResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<ActionResult<GetHourlyHistoryResponse>> GetHourlyHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Guid userId = GetUserId();

        GetHourlyHistoryQuery query = new()
        {
            UserId = userId,
            Page = page,
            PageSize = pageSize
        };

        GetHourlyHistoryResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class AnswerQuestionRequest
{
    public string SelectedOption { get; set; } = string.Empty;
}