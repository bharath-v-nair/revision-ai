namespace RevisionAI.Application.Questions.Queries.GetQuestionDetail;

public class MediaDto
{
    public Guid Id { get; set; }
    public string MediaType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public int PageNumber { get; set; }
    public bool IsExplanation { get; set; }
}