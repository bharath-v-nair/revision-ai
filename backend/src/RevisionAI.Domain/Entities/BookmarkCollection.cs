using System.Diagnostics.CodeAnalysis;

namespace RevisionAI.Domain.Entities;

[SuppressMessage("Naming", "CA1711:IdentifiersShouldNotHaveIncorrectSuffix", Justification = "BookmarkCollection is a meaningful domain concept, not just a general collection wrapper")]
public class BookmarkCollection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<BookmarkItem> Items { get; set; } = new List<BookmarkItem>();
}