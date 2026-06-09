using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Queries.GetStreak;

public class GetStreakQuery : IRequest<StreakDto>
{
    public Guid UserId { get; set; }
}