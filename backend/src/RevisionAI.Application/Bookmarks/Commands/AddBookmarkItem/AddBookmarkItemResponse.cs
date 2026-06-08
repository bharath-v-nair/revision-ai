namespace RevisionAI.Application.Bookmarks.Commands.AddBookmarkItem;

public class AddBookmarkItemResponse
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}