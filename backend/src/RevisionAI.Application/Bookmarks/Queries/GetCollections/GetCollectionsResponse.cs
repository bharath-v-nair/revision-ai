namespace RevisionAI.Application.Bookmarks.Queries.GetCollections;

public class GetCollectionsResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}