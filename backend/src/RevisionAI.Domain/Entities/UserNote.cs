namespace RevisionAI.Domain.Entities;

public class UserNote
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? TopicId { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public string NoteType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Question? Question { get; set; }
    public Topic? Topic { get; set; }
}