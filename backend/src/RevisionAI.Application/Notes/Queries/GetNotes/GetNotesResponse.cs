namespace RevisionAI.Application.Notes.Queries.GetNotes;

public class GetNotesResponse
{
    public Guid Id { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? TopicId { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public string NoteType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}