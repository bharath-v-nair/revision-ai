using MediatR;

namespace RevisionAI.Application.Subjects.Queries.GetSubjectChapters;

public class GetSubjectChaptersQuery : IRequest<GetSubjectChaptersResponse>
{
    public string SubjectSlug { get; set; } = string.Empty;
}