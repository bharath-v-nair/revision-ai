using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class UserAttemptConfiguration : IEntityTypeConfiguration<UserAttempt>
{
    public void Configure(EntityTypeBuilder<UserAttempt> builder)
    {
        builder.ToTable("UserAttempts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.SelectedOption)
            .IsRequired()
            .HasColumnType("char(1)");

        builder.Property(a => a.IsCorrect)
            .IsRequired();

        builder.Property(a => a.TimeTakenMs)
            .IsRequired();

        builder.Property(a => a.Confidence)
            .HasMaxLength(20);

        builder.Property(a => a.AttemptNumber)
            .IsRequired();

        builder.Property(a => a.SessionType)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasOne(a => a.User)
            .WithMany(u => u.UserAttempts)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Question)
            .WithMany(q => q.UserAttempts)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.CreatedAt);
        builder.HasIndex(a => new { a.UserId, a.QuestionId });
    }
}