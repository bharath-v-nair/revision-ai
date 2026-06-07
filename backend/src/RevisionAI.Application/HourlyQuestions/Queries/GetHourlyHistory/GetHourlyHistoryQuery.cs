using MediatR;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetHourlyHistory;

public class GetHourlyHistoryQuery : IRequest<GetHourlyHistoryResponse>
{
    public Guid UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}