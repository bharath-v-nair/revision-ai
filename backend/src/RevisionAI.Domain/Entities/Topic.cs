namespace RevisionAI.Domain.Entities;

public class Topic
{
    public Guid Id { get; set; }
    public Guid ChapterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? QuestionCount { get; set; }

    // Navigation properties
    public Chapter Chapter { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<UserNote> UserNotes { get; set; } = new List<UserNote>();
}