// DTOs for the Social feature (Friends + Leaderboards).
// Shapes verified against the C# controllers — see docs/Backend-Architecture-HLD.md.

export interface FriendDto {
  /** Friendship record ID — used for unfriend (DELETE /api/friends/{id}). NOT the friend's user ID. */
  id: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
}

export interface FriendRequestDto {
  /** Friend-request record ID — used for accept/decline. */
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Present on the friends + weekly leaderboards. */
  weeklyXp?: number;
  /** Present on the global leaderboard. */
  totalXp?: number;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  level: number;
}

/** Locally-persisted record of a friend request we sent. */
export interface SentRequest {
  userId: string;
  displayName: string;
  email: string;
  sentAt: string; // ISO date
}
