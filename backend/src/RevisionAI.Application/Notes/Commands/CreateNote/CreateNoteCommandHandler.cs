using FluentValidation;
using MediatR;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Notes.Commands.CreateNote;

public class CreateNoteCommandHandler : IRequestHandler<CreateNoteCommand, CreateNoteResponse>
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private readonly IAppDbContext _context;
    private readonly INoteStorageService _noteStorageService;

    public CreateNoteCommandHandler(IAppDbContext context, INoteStorageService noteStorageService)
    {
        _context = context;
        _noteStorageService = noteStorageService;
    }

    public async Task<CreateNoteResponse> Handle(CreateNoteCommand request, CancellationToken cancellationToken)
    {
        // Validate file size
        if (request.File.Length > MaxFileSizeBytes)
        {
            throw new ValidationException(
                "File size exceeds maximum allowed size of 10 MB.",
                [new FluentValidation.Results.ValidationFailure("File", "File size exceeds 10 MB.")]);
        }

        // Validate MIME type
        if (!AllowedMimeTypes.Contains(request.File.ContentType))
        {
            throw new ValidationException(
                "Invalid file type. Only PNG, JPEG, and WebP images are allowed.",
                [new FluentValidation.Results.ValidationFailure("File", "Invalid file type.")]);
        }

        // Generate unique filename
        string extension = Path.GetExtension(request.File.FileName);
        if (string.IsNullOrEmpty(extension))
        {
            extension = ".png";
        }

        string uniqueFileName = $"{Guid.NewGuid()}{extension}";

        // Save to storage
        using Stream fileStream = request.File.OpenReadStream();
        string blobUrl = await _noteStorageService.SaveAsync(fileStream, uniqueFileName, request.File.ContentType, cancellationToken);

        // Create entity
        UserNote note = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            QuestionId = request.QuestionId,
            TopicId = request.TopicId,
            BlobUrl = blobUrl,
            NoteType = request.NoteType,
            CreatedAt = DateTime.UtcNow
        };

        _context.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateNoteResponse
        {
            Id = note.Id,
            QuestionId = note.QuestionId,
            TopicId = note.TopicId,
            BlobUrl = note.BlobUrl,
            NoteType = note.NoteType,
            CreatedAt = note.CreatedAt
        };
    }
}