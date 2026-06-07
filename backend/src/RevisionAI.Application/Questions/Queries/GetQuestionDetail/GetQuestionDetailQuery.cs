using MediatR;

namespace RevisionAI.Application.Questions.Queries.GetQuestionDetail;

public class GetQuestionDetailQuery : IRequest<GetQuestionDetailResponse?>
{
    public Guid Id { get; set; }
}