using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class QuestionScheduleConfiguration : IEntityTypeConfiguration<QuestionSchedule>
{
    public void Configure(EntityTypeBuilder<QuestionSchedule> builder)
    {
        builder.ToTable("QuestionSchedules");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.EaseFactor)
            .IsRequired()
            .HasDefaultValue(2.5);

        builder.Property(s => s.Interval)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.Repetitions)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.NextReviewDate)
            .IsRequired();

        builder.HasOne(s => s.User)
            .WithMany(u => u.QuestionSchedules)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Question)
            .WithMany(q => q.Schedules)
            .HasForeignKey(s => s.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.NextReviewDate);

        // A user can only have one schedule per question
        builder.HasIndex(s => new { s.UserId, s.QuestionId }).IsUnique();
    }
}