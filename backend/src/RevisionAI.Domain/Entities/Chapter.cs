namespace RevisionAI.Domain.Entities;

public class Chapter
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public int StartPage { get; set; }
    public int EndPage { get; set; }

    // Navigation properties
    public Subject Subject { get; set; } = null!;
    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}