using MediatR;

namespace RevisionAI.Application.HourlyQuestions.Commands.AnswerQuestion;

public class AnswerQuestionCommand : IRequest<AnswerQuestionResponse>
{
    public Guid PendingQuestionId { get; set; }
    public Guid UserId { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
}