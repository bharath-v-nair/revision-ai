using MediatR;

namespace RevisionAI.Application.Mocks.Commands.SubmitMockAnswers;

public class SubmitMockAnswersCommand : IRequest<SubmitMockAnswersResponse>
{
    public Guid MockSessionId { get; set; }
    public Guid UserId { get; set; }
    public List<AnswerInput> Answers { get; set; } = new();
}

public class AnswerInput
{
    public Guid QuestionId { get; set; }
    public int DisplayOrder { get; set; }
    public char SelectedOption { get; set; }
    public int TimeTakenMs { get; set; }
}