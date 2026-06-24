using MediatR;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqPapers;

public class GetPyqPapersQuery : IRequest<GetPyqPapersResponse?>
{
    public string SubjectSlug { get; set; } = string.Empty;
}
