using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class MockSessionConfiguration : IEntityTypeConfiguration<MockSession>
{
    public void Configure(EntityTypeBuilder<MockSession> builder)
    {
        builder.ToTable("MockSessions");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.MockConfig)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.Property(m => m.QuestionCount)
            .IsRequired();

        builder.Property(m => m.StartedAt)
            .IsRequired();

        builder.HasOne(m => m.User)
            .WithMany(u => u.MockSessions)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.UserId);
    }
}