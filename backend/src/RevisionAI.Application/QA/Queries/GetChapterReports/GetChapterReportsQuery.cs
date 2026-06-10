using MediatR;

namespace RevisionAI.Application.QA.Queries.GetChapterReports;

public class GetChapterReportsQuery : IRequest<ChapterReportsDto>
{
    public Guid ChapterId { get; init; }
}
