using RevisionAI.Application.Questions.Queries.GetQuestionDetail;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqPaperQuestions;

public class GetPyqPaperQuestionsResponse
{
    public string ExamName { get; set; } = string.Empty;
    public List<QuestionDetailDto> Data { get; set; } = new();
}
