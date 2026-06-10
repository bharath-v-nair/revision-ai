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
        "image/webp",
        "application/pdf",
        "application/octet-stream", // some browsers send this for PDFs
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".pdf",
    };

    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

    private readonly IAppDbContext _context;
    private readonly INoteStorageService _noteStorageService;

    public CreateNoteCommandHandler(IAppDbContext context, INoteStorageService noteStorageService)
    {
        _context = context;
        _noteStorageService = noteStorageService;
    }

    public async Task<CreateNoteResponse> Handle(CreateNoteCommand request, CancellationToken cancellationToken)
    {
        if (!request.ChapterId.HasValue && !request.QuestionId.HasValue)
        {
            throw new ValidationException(
                "Either ChapterId or QuestionId must be provided.",
                [new FluentValidation.Results.ValidationFailure("ChapterId", "Either ChapterId or QuestionId must be provided.")]);
        }

        // Validate file size
        if (request.File.Length > MaxFileSizeBytes)
        {
            throw new ValidationException(
                "File size exceeds the 20 MB limit.",
                [new FluentValidation.Results.ValidationFailure("File", "File size exceeds 20 MB.")]);
        }

        // Validate: MIME type OR file extension must be allowed
        string extension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
        bool mimeAllowed = AllowedMimeTypes.Contains(request.File.ContentType);
        bool extAllowed = AllowedExtensions.Contains(extension);

        if (!mimeAllowed && !extAllowed)
        {
            throw new ValidationException(
                "Invalid file type. Only PNG, JPEG, WebP images and PDFs are allowed.",
                [new FluentValidation.Results.ValidationFailure("File", "Invalid file type.")]);
        }

        // Generate unique filename
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
            ChapterId = request.ChapterId,
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
            ChapterId = note.ChapterId,
            TopicId = note.TopicId,
            BlobUrl = note.BlobUrl,
            NoteType = note.NoteType,
            CreatedAt = note.CreatedAt
        };
    }
}