using MediatR;

namespace RevisionAI.Application.Questions.Queries.GetQuestionDetail;

public class GetQuestionMediaQuery : IRequest<GetQuestionMediaResponse?>
{
    public Guid Id { get; set; }
}