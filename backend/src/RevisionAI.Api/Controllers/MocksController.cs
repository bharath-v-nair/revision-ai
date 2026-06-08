using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Mocks.Commands.CompleteMock;
using RevisionAI.Application.Mocks.Commands.GenerateMock;
using RevisionAI.Application.Mocks.Commands.RetakeIncorrect;
using RevisionAI.Application.Mocks.Commands.SubmitMockAnswers;
using RevisionAI.Application.Mocks.Queries.GetMockHistory;
using RevisionAI.Application.Mocks.Queries.GetMockResults;
using RevisionAI.Application.Mocks.Queries.GetMockSession;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/mocks")]
[Authorize]
public class MocksController : ControllerBase
{
    private readonly IMediator _mediator;

    public MocksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Endpoint 1: Generate a new mock session from random questions in selected subjects.
    /// </summary>
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateMockResponse>> GenerateMock(
        [FromBody] GenerateMockRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GenerateMockCommand command = new()
        {
            UserId = userId,
            SubjectIds = request.SubjectIds,
            QuestionCount = request.QuestionCount,
            TimeLimitMinutes = request.TimeLimitMinutes
        };

        GenerateMockResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 2: Get a mock session with questions (no correct answers revealed).
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GetMockSessionResponse>> GetMockSession(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetMockSessionQuery query = new()
        {
            MockSessionId = id,
            UserId = userId
        };

        GetMockSessionResponse? result = await _mediator.Send(query, cancellationToken);

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 3: Submit answers for a mock session (batch).
    /// </summary>
    [HttpPost("{mockSessionId:guid}/answers")]
    public async Task<ActionResult<SubmitMockAnswersResponse>> SubmitMockAnswers(
        Guid mockSessionId,
        [FromBody] SubmitAnswersRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        SubmitMockAnswersCommand command = new()
        {
            MockSessionId = mockSessionId,
            UserId = userId,
            Answers = request.Answers
        };

        SubmitMockAnswersResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 4: Complete a mock session.
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<CompleteMockResponse>> CompleteMock(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        CompleteMockCommand command = new()
        {
            MockSessionId = id,
            UserId = userId
        };

        CompleteMockResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 5: Get full results of a completed mock session.
    /// </summary>
    [HttpGet("{id:guid}/results")]
    public async Task<ActionResult<GetMockResultsResponse>> GetMockResults(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetMockResultsQuery query = new()
        {
            MockSessionId = id,
            UserId = userId
        };

        GetMockResultsResponse? result = await _mediator.Send(query, cancellationToken);

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 6: Get paginated history of completed mock sessions.
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<GetMockHistoryResponse>> GetMockHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Guid userId = GetUserId();

        GetMockHistoryQuery query = new()
        {
            UserId = userId,
            Page = page,
            PageSize = pageSize
        };

        GetMockHistoryResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 7: Retake only incorrect questions from a previous mock session.
    /// </summary>
    [HttpPost("generate/retake-incorrect")]
    public async Task<ActionResult<GenerateMockResponse>> RetakeIncorrect(
        [FromBody] RetakeIncorrectRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        RetakeIncorrectCommand command = new()
        {
            PreviousMockSessionId = request.PreviousMockSessionId,
            UserId = userId
        };

        GenerateMockResponse result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

// Request DTOs

public class GenerateMockRequest
{
    public List<Guid> SubjectIds { get; set; } = new();
    public int QuestionCount { get; set; }
    public int? TimeLimitMinutes { get; set; }
}

public class SubmitAnswersRequest
{
    public List<AnswerInput> Answers { get; set; } = new();
}

public class RetakeIncorrectRequest
{
    public Guid PreviousMockSessionId { get; set; }
}