using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.Bookmarks.Queries.GetCollectionItems;

public class GetCollectionItemsResponse
{
    public List<QuestionDto> Data { get; set; } = new();
    public MetaDto Meta { get; set; } = new();
}