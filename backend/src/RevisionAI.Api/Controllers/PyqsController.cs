using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Pyqs.Queries.GetPyqPaperQuestions;
using RevisionAI.Application.Pyqs.Queries.GetPyqPapers;
using RevisionAI.Application.Pyqs.Queries.GetPyqSubjects;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/pyqs")]
[Authorize]
public class PyqsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PyqsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Endpoint 1: List subjects that have at least one Previous-Year Question paper.
    /// </summary>
    [HttpGet("subjects")]
    public async Task<ActionResult<GetPyqSubjectsResponse>> GetPyqSubjects(
        CancellationToken cancellationToken)
    {
        GetPyqSubjectsResponse result = await _mediator.Send(new GetPyqSubjectsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Endpoint 2: List all PYQ exam papers for a subject (sorted by year desc on the client).
    /// </summary>
    [HttpGet("subjects/{subjectSlug}/papers")]
    public async Task<ActionResult<GetPyqPapersResponse>> GetPyqPapers(
        string subjectSlug,
        CancellationToken cancellationToken)
    {
        GetPyqPapersResponse? result = await _mediator.Send(
            new GetPyqPapersQuery { SubjectSlug = subjectSlug }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Endpoint 3: Fetch every question for a given subject's exam paper (full mock).
    /// Scoped by subjectSlug because ExamName is not unique across subjects. examName is URL-encoded.
    /// </summary>
    [HttpGet("subjects/{subjectSlug}/papers/{examName}/questions")]
    public async Task<ActionResult<GetPyqPaperQuestionsResponse>> GetPyqPaperQuestions(
        string subjectSlug,
        string examName,
        CancellationToken cancellationToken)
    {
        GetPyqPaperQuestionsResponse? result = await _mediator.Send(
            new GetPyqPaperQuestionsQuery { SubjectSlug = subjectSlug, ExamName = examName }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}
