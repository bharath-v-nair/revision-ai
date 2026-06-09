namespace RevisionAI.Application.Gamification.Dtos;

public class XpTransactionDto
{
    public Guid Id { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid? QuestionId { get; set; }
    public DateTime CreatedAt { get; set; }
}