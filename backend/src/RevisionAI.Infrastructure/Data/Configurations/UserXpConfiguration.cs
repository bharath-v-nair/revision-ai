using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class UserXpConfiguration : IEntityTypeConfiguration<UserXp>
{
    public void Configure(EntityTypeBuilder<UserXp> builder)
    {
        builder.ToTable("UserXp");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TotalXp)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.CurrentLevel)
            .IsRequired()
            .HasDefaultValue(1);

        builder.HasOne(x => x.User)
            .WithOne(u => u.Xp)
            .HasForeignKey<UserXp>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.UserId)
            .IsUnique();
    }
}