namespace RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;

public class GetPendingQuestionsResponse
{
    public List<PendingQuestionDto> Data { get; set; } = new();
}