using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Commands.TickStreak;

public class TickStreakCommand : IRequest<StreakDto>
{
    public Guid UserId { get; set; }
}