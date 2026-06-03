using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class MockSessionAnswerConfiguration : IEntityTypeConfiguration<MockSessionAnswer>
{
    public void Configure(EntityTypeBuilder<MockSessionAnswer> builder)
    {
        builder.ToTable("MockSessionAnswers");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.SelectedOption)
            .HasColumnType("char(1)");

        builder.Property(a => a.DisplayOrder)
            .IsRequired();

        builder.HasOne(a => a.MockSession)
            .WithMany(m => m.Answers)
            .HasForeignKey(a => a.MockSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Question)
            .WithMany(q => q.MockSessionAnswers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.MockSessionId);
        builder.HasIndex(a => new { a.MockSessionId, a.QuestionId }).IsUnique();
    }
}