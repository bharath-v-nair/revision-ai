namespace RevisionAI.Application.Notes.Queries.GetNotes;

public class GetNotesResponse
{
    public Guid Id { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? ChapterId { get; set; }
    public Guid? TopicId { get; set; }
    public string ChapterTitle { get; set; } = string.Empty;
    public int ChapterNumber { get; set; }
    public Guid? SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public string NoteType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
