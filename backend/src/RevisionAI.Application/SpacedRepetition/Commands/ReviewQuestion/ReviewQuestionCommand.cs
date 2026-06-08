using FluentValidation;
using MediatR;

namespace RevisionAI.Application.SpacedRepetition.Commands.ReviewQuestion;

public class ReviewQuestionCommand : IRequest<ReviewQuestionResponse>
{
    public Guid QuestionId { get; init; }
    public Guid UserId { get; init; }
    public char SelectedOption { get; init; }
    public int TimeTakenMs { get; init; }
}

public class ReviewQuestionCommandValidator : AbstractValidator<ReviewQuestionCommand>
{
    public ReviewQuestionCommandValidator()
    {
        RuleFor(x => x.QuestionId)
            .NotEmpty();

        RuleFor(x => x.UserId)
            .NotEmpty();

        RuleFor(x => x.SelectedOption)
            .Must(opt => opt == 'A' || opt == 'B' || opt == 'C' || opt == 'D')
            .WithMessage("SelectedOption must be A, B, C, or D.");

        RuleFor(x => x.TimeTakenMs)
            .GreaterThanOrEqualTo(0);
    }
}