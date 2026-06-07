namespace RevisionAI.Application.Questions.Queries.GetQuestions;

public class GetQuestionsResponse
{
    public List<QuestionDto> Data { get; set; } = new();
    public MetaDto Meta { get; set; } = new();
}

public class MetaDto
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public bool HasNext { get; set; }
}