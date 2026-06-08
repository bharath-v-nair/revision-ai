using MediatR;

namespace RevisionAI.Application.Notes.Commands.DeleteNote;

public class DeleteNoteCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid NoteId { get; set; }
}