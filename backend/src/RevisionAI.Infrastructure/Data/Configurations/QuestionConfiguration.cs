using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.QuestionText)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.OptionA)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.OptionB)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.OptionC)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.OptionD)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.CorrectOption)
            .IsRequired()
            .HasColumnType("char(1)");

        builder.Property(q => q.Explanation)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(q => q.QuestionNumber)
            .IsRequired();

        builder.Property(q => q.SourcePage)
            .IsRequired();

        builder.Property(q => q.HasMedia)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(q => q.IsPYQ)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(q => q.ExamName)
            .HasMaxLength(200);

        builder.Property(q => q.CreatedAt)
            .IsRequired();

        builder.HasOne(q => q.Subject)
            .WithMany(s => s.Questions)
            .HasForeignKey(q => q.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Chapter)
            .WithMany(c => c.Questions)
            .HasForeignKey(q => q.ChapterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Topic)
            .WithMany(t => t.Questions)
            .HasForeignKey(q => q.TopicId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(q => q.SubjectId);
        builder.HasIndex(q => q.ChapterId);
        builder.HasIndex(q => q.TopicId);
        builder.HasIndex(q => q.IsPYQ);
    }
}