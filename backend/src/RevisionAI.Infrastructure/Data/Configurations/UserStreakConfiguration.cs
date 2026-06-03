using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class UserStreakConfiguration : IEntityTypeConfiguration<UserStreak>
{
    public void Configure(EntityTypeBuilder<UserStreak> builder)
    {
        builder.ToTable("UserStreaks");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.CurrentStreak)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.LongestStreak)
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(s => s.User)
            .WithOne(u => u.Streak)
            .HasForeignKey<UserStreak>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.UserId)
            .IsUnique();
    }
}