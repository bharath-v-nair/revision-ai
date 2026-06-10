using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.QA.Commands.DeleteQuestionReport;

public class DeleteQuestionReportCommandHandler : IRequestHandler<DeleteQuestionReportCommand>
{
    private readonly IAppDbContext _context;

    public DeleteQuestionReportCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteQuestionReportCommand request, CancellationToken cancellationToken)
    {
        int deleted = await _context.QuestionReports
            .Where(r => r.QuestionId == request.QuestionId && r.UserId == request.UserId)
            .ExecuteDeleteAsync(cancellationToken);

        // Silently succeed if no report existed
        _ = deleted;
    }
}
