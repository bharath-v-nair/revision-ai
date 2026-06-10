using MediatR;
using Microsoft.AspNetCore.Http;

namespace RevisionAI.Application.Notes.Commands.CreateNote;

public class CreateNoteCommand : IRequest<CreateNoteResponse>
{
    public Guid UserId { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? ChapterId { get; set; }
    public Guid? TopicId { get; set; }
    public string NoteType { get; set; } = string.Empty;
    public IFormFile File { get; set; } = null!;
}
