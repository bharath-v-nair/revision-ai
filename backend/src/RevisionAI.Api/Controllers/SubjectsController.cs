using MediatR;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Subjects.Queries.GetSubjectChapters;
using RevisionAI.Application.Subjects.Queries.GetSubjects;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubjectsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetSubjectsResponse>> GetSubjects(
        CancellationToken cancellationToken)
    {
        GetSubjectsResponse result = await _mediator.Send(new GetSubjectsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{subjectSlug}/chapters")]
    public async Task<ActionResult<GetSubjectChaptersResponse>> GetSubjectChapters(
        string subjectSlug,
        CancellationToken cancellationToken)
    {
        GetSubjectChaptersResponse? result = await _mediator.Send(
            new GetSubjectChaptersQuery { SubjectSlug = subjectSlug }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}