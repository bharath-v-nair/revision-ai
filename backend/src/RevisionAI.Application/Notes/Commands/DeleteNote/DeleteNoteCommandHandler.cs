using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Notes.Commands.DeleteNote;

public class DeleteNoteCommandHandler : IRequestHandler<DeleteNoteCommand>
{
    private readonly IAppDbContext _context;
    private readonly INoteStorageService _noteStorageService;

    public DeleteNoteCommandHandler(IAppDbContext context, INoteStorageService noteStorageService)
    {
        _context = context;
        _noteStorageService = noteStorageService;
    }

    public async Task Handle(DeleteNoteCommand request, CancellationToken cancellationToken)
    {
        UserNote? note = await _context.UserNotes
            .FirstOrDefaultAsync(n => n.Id == request.NoteId, cancellationToken);

        if (note is null || note.UserId != request.UserId)
        {
            throw new ValidationException(
                "Note not found.",
                [new FluentValidation.Results.ValidationFailure("NoteId", "Note not found.")]);
        }

        // Delete from storage
        await _noteStorageService.DeleteAsync(note.BlobUrl, cancellationToken);

        // Delete from database
        _context.UserNotes.Remove(note);
        await _context.SaveChangesAsync(cancellationToken);
    }
}