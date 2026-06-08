using MediatR;

namespace RevisionAI.Application.Notes.Queries.GetNotes;

public class GetNotesQuery : IRequest<List<GetNotesResponse>>
{
    public Guid UserId { get; set; }
    public Guid? QuestionId { get; set; }
    public Guid? TopicId { get; set; }
}