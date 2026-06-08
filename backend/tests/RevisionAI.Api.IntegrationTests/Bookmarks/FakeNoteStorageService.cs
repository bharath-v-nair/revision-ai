using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Api.IntegrationTests.Bookmarks;

public class FakeNoteStorageService : INoteStorageService
{
    public string? LastSavedBlobUrl { get; private set; }
    public string? LastDeletedBlobUrl { get; private set; }

    public Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        LastSavedBlobUrl = $"/uploads/notes/{fileName}";
        return Task.FromResult(LastSavedBlobUrl);
    }

    public Task DeleteAsync(string blobUrl, CancellationToken cancellationToken)
    {
        LastDeletedBlobUrl = blobUrl;
        return Task.CompletedTask;
    }
}