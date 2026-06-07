using MediatR;

namespace RevisionAI.Application.Questions.Queries.GetQuestions;

public class GetQuestionsQuery : IRequest<GetQuestionsResponse?>
{
    public string SubjectSlug { get; set; } = string.Empty;
    public int? ChapterNumber { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}