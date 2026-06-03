using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.ToTable("Friendships");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        builder.HasOne(f => f.Requester)
            .WithMany(u => u.RequestedFriendships)
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Addressee)
            .WithMany(u => u.ReceivedFriendships)
            .HasForeignKey(f => f.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(f => f.RequesterId);
        builder.HasIndex(f => f.AddresseeId);
        builder.HasIndex(f => new { f.RequesterId, f.AddresseeId }).IsUnique();
    }
}