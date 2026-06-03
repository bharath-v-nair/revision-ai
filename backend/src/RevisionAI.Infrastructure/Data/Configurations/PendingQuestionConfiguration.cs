using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class PendingQuestionConfiguration : IEntityTypeConfiguration<PendingQuestion>
{
    public void Configure(EntityTypeBuilder<PendingQuestion> builder)
    {
        builder.ToTable("PendingQuestions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.IsAnswered)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.ExpiresAt)
            .IsRequired();

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.HasOne(p => p.User)
            .WithMany(u => u.PendingQuestions)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Question)
            .WithMany(q => q.PendingQuestions)
            .HasForeignKey(p => p.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => p.ExpiresAt);
        builder.HasIndex(p => new { p.UserId, p.IsAnswered, p.ExpiresAt });
    }
}