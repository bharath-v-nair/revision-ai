using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Infrastructure.Services;

public class LocalNoteStorageService : INoteStorageService
{
    private readonly string _storageRoot;

    public LocalNoteStorageService(string storageRoot)
    {
        _storageRoot = storageRoot;
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        string uploadsFolder = Path.Combine(_storageRoot, "uploads", "notes");
        Directory.CreateDirectory(uploadsFolder);

        string filePath = Path.Combine(uploadsFolder, fileName);
        await using FileStream fileStream = new(filePath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream, cancellationToken);

        return $"/uploads/notes/{fileName}";
    }

    public Task DeleteAsync(string blobUrl, CancellationToken cancellationToken)
    {
        string relativePath = blobUrl.TrimStart('/');
        string filePath = Path.Combine(_storageRoot, relativePath);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        return Task.CompletedTask;
    }
}