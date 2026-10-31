using MediatR;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqPaperQuestions;

public class GetPyqPaperQuestionsQuery : IRequest<GetPyqPaperQuestionsResponse?>
{
    public string SubjectSlug { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
}
