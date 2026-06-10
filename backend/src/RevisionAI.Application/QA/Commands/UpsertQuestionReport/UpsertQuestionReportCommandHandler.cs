using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.QA.Commands.UpsertQuestionReport;

public class UpsertQuestionReportCommandHandler : IRequestHandler<UpsertQuestionReportCommand, QuestionReportDto>
{
    private readonly IAppDbContext _context;

    public UpsertQuestionReportCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<QuestionReportDto> Handle(UpsertQuestionReportCommand request, CancellationToken cancellationToken)
    {
        QuestionReport? existing = await _context.QuestionReports
            .FirstOrDefaultAsync(r => r.QuestionId == request.QuestionId && r.UserId == request.UserId, cancellationToken);

        DateTime now = DateTime.UtcNow;

        if (existing is null)
        {
            existing = new QuestionReport
            {
                Id = Guid.NewGuid(),
                QuestionId = request.QuestionId,
                UserId = request.UserId,
                Issues = request.Issues,
                Notes = request.Notes,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.Add(existing);
        }
        else
        {
            existing.Issues = request.Issues;
            existing.Notes = request.Notes;
            existing.UpdatedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new QuestionReportDto
        {
            ReportId = existing.Id,
            QuestionId = existing.QuestionId,
            Issues = existing.Issues,
            Notes = existing.Notes,
            UpdatedAt = existing.UpdatedAt
        };
    }
}
