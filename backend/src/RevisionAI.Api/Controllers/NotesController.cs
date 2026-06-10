using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Notes.Commands.CreateNote;
using RevisionAI.Application.Notes.Commands.DeleteNote;
using RevisionAI.Application.Notes.Queries.GetNotes;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/notes")]
[Authorize]
[RequestSizeLimit(20 * 1024 * 1024)] // 20 MB (PDFs can be larger)
public class NotesController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Upload a note (handwritten/digital/drawing).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CreateNoteResponse>> CreateNote(
        IFormFile file,
        [FromQuery] Guid? questionId,
        [FromQuery] Guid? chapterId,
        [FromQuery] Guid? topicId,
        [FromQuery] string noteType = "Digital",
        CancellationToken cancellationToken = default)
    {
        Guid userId = GetUserId();

        CreateNoteCommand command = new()
        {
            UserId = userId,
            QuestionId = questionId,
            ChapterId = chapterId,
            TopicId = topicId,
            NoteType = noteType,
            File = file
        };

        CreateNoteResponse result = await _mediator.Send(command, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>
    /// Get notes for a question, chapter, subject, or all user notes.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<GetNotesResponse>>> GetNotes(
        [FromQuery] Guid? questionId,
        [FromQuery] Guid? chapterId,
        [FromQuery] Guid? subjectId,
        [FromQuery] Guid? topicId,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetNotesQuery query = new()
        {
            UserId = userId,
            QuestionId = questionId,
            ChapterId = chapterId,
            SubjectId = subjectId,
            TopicId = topicId
        };

        List<GetNotesResponse> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Delete a note.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        DeleteNoteCommand command = new()
        {
            UserId = userId,
            NoteId = id
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}
