using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class QuestionReportConfiguration : IEntityTypeConfiguration<QuestionReport>
{
    public void Configure(EntityTypeBuilder<QuestionReport> builder)
    {
        builder.ToTable("QuestionReports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Issues)
            .HasColumnType("text[]")
            .IsRequired();

        builder.Property(r => r.Notes)
            .HasMaxLength(1000);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt).IsRequired();

        builder.HasOne(r => r.Question)
            .WithMany(q => q.QuestionReports)
            .HasForeignKey(r => r.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany(u => u.QuestionReports)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One report per (question, user) pair — upsert semantics
        builder.HasIndex(r => new { r.QuestionId, r.UserId }).IsUnique();
    }
}
