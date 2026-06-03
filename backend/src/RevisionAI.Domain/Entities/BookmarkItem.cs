namespace RevisionAI.Domain.Entities;

public class BookmarkItem
{
    public Guid Id { get; set; }
    public Guid CollectionId { get; set; }
    public Guid QuestionId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public BookmarkCollection Collection { get; set; } = null!;
    public Question Question { get; set; } = null!;
}