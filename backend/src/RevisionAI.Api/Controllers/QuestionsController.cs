using MediatR;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Questions.Queries.GetQuestionDetail;
using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public QuestionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetQuestionsResponse>> GetQuestions(
        [FromQuery] string subjectSlug,
        [FromQuery] int? chapterNumber,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        GetQuestionsResponse? result = await _mediator.Send(
            new GetQuestionsQuery
            {
                SubjectSlug = subjectSlug,
                ChapterNumber = chapterNumber,
                Page = page,
                PageSize = pageSize
            }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GetQuestionDetailResponse>> GetQuestionDetail(
        Guid id,
        CancellationToken cancellationToken)
    {
        GetQuestionDetailResponse? result = await _mediator.Send(
            new GetQuestionDetailQuery { Id = id }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}/media")]
    public async Task<ActionResult<GetQuestionMediaResponse>> GetQuestionMedia(
        Guid id,
        CancellationToken cancellationToken)
    {
        GetQuestionMediaResponse? result = await _mediator.Send(
            new GetQuestionMediaQuery { Id = id }, cancellationToken);

        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}