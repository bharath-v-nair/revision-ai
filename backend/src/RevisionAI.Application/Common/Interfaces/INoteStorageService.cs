namespace RevisionAI.Application.Common.Interfaces;

public interface INoteStorageService
{
    Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken);
    Task DeleteAsync(string blobUrl, CancellationToken cancellationToken);
}