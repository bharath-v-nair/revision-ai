using RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetHourlyHistory;

public class HourlyHistoryDto
{
    public Guid PendingQuestionId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsAnswered { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public string? UserAnswer { get; set; }
    public required QuestionWithoutAnswersDto Question { get; set; }
}
