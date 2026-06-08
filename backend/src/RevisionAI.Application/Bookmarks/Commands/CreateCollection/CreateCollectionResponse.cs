namespace RevisionAI.Application.Bookmarks.Commands.CreateCollection;

public class CreateCollectionResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}