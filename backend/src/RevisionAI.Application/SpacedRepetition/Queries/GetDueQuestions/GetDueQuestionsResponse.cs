using RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;
using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.SpacedRepetition.Queries.GetDueQuestions;

public class GetDueQuestionsResponse
{
    public List<DueQuestionDto> Data { get; set; } = new();
    public MetaDto Meta { get; set; } = new();
}

public class DueQuestionDto
{
    public Guid QuestionScheduleId { get; set; }
    public required QuestionWithoutAnswersDto Question { get; set; }
    public double EaseFactor { get; set; }
    public int Interval { get; set; }
    public int Repetitions { get; set; }
    public DateTime NextReviewDate { get; set; }
}