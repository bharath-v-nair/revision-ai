namespace RevisionAI.Domain.Entities;

public class QuestionMedia
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string MediaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public int PageNumber { get; set; }

    // Navigation
    public Question Question { get; set; } = null!;
}