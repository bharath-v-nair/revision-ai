using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.QA;
using RevisionAI.Application.QA.Commands.DeleteQuestionReport;
using RevisionAI.Application.QA.Commands.UpsertQuestionReport;
using RevisionAI.Application.QA.Queries.GetAllSubjectReportSummaries;
using RevisionAI.Application.QA.Queries.GetChapterReports;
using RevisionAI.Application.QA.Queries.GetQuestionReport;
using RevisionAI.Application.QA.Queries.GetSubjectReports;

namespace RevisionAI.Api.Controllers;

/// <summary>
/// QA error-reporting endpoints — development/QC feature, not core product.
/// Remove this controller (and the QA application layer) once content is stable.
/// </summary>
[ApiController]
[Route("api/qa")]
[Authorize]
public class QaController : ControllerBase
{
    private readonly IMediator _mediator;

    public QaController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Get the current user's report for a question, or null if not reported.</summary>
    [HttpGet("questions/{questionId:guid}/report")]
    public async Task<ActionResult<QuestionReportDto?>> GetReport(Guid questionId, CancellationToken cancellationToken)
    {
        QuestionReportDto? result = await _mediator.Send(new GetQuestionReportQuery
        {
            UserId = GetUserId(),
            QuestionId = questionId
        }, cancellationToken);

        return Ok(result);
    }

    /// <summary>Create or update the current user's report for a question.</summary>
    [HttpPost("questions/{questionId:guid}/report")]
    public async Task<ActionResult<QuestionReportDto>> UpsertReport(
        Guid questionId,
        [FromBody] UpsertReportRequest request,
        CancellationToken cancellationToken)
    {
        QuestionReportDto result = await _mediator.Send(new UpsertQuestionReportCommand
        {
            UserId = GetUserId(),
            QuestionId = questionId,
            Issues = request.Issues,
            Notes = request.Notes
        }, cancellationToken);

        return Ok(result);
    }

    /// <summary>Remove the current user's report for a question.</summary>
    [HttpDelete("questions/{questionId:guid}/report")]
    public async Task<IActionResult> DeleteReport(Guid questionId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteQuestionReportCommand
        {
            UserId = GetUserId(),
            QuestionId = questionId
        }, cancellationToken);

        return NoContent();
    }

    /// <summary>Get all flagged questions for a chapter (admin view).</summary>
    [HttpGet("chapters/{chapterId:guid}/reports")]
    public async Task<ActionResult<ChapterReportsDto>> GetChapterReports(Guid chapterId, CancellationToken cancellationToken)
    {
        ChapterReportsDto result = await _mediator.Send(new GetChapterReportsQuery
        {
            ChapterId = chapterId
        }, cancellationToken);

        return Ok(result);
    }

    /// <summary>Get per-chapter flagged counts for a subject (admin view).</summary>
    [HttpGet("subjects/{subjectId:guid}/reports")]
    public async Task<ActionResult<SubjectReportSummaryDto>> GetSubjectReports(Guid subjectId, CancellationToken cancellationToken)
    {
        SubjectReportSummaryDto result = await _mediator.Send(new GetSubjectReportsQuery
        {
            SubjectId = subjectId
        }, cancellationToken);

        return Ok(result);
    }

    /// <summary>Get flagged counts for all subjects (admin index).</summary>
    [HttpGet("subjects/reports")]
    public async Task<ActionResult<List<SubjectReportIndexDto>>> GetAllSubjectReports(CancellationToken cancellationToken)
    {
        List<SubjectReportIndexDto> result = await _mediator.Send(new GetAllSubjectReportSummariesQuery(), cancellationToken);
        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class UpsertReportRequest
{
    public string[] Issues { get; set; } = [];
    public string? Notes { get; set; }
}
