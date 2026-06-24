import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FriendDto,
  FriendRequestDto,
  LeaderboardEntry,
  UserSearchResult,
} from './friends.models';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private http = inject(HttpClient);

  // ─── Friends ──────────────────────────────────────────────────────
  getFriends(): Observable<FriendDto[]> {
    return this.http.get<FriendDto[]>('/api/friends');
  }

  getRequests(): Observable<FriendRequestDto[]> {
    return this.http.get<FriendRequestDto[]>('/api/friends/requests');
  }

  sendRequest(email: string): Observable<unknown> {
    return this.http.post('/api/friends/request', { email });
  }

  acceptRequest(id: string): Observable<unknown> {
    return this.http.post(`/api/friends/requests/${id}/accept`, {});
  }

  declineRequest(id: string): Observable<unknown> {
    return this.http.post(`/api/friends/requests/${id}/decline`, {});
  }

  unfriend(id: string): Observable<unknown> {
    return this.http.delete(`/api/friends/${id}`);
  }

  // ─── User search ──────────────────────────────────────────────────
  searchUsers(q: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
  }

  // ─── Leaderboards ─────────────────────────────────────────────────
  getFriendsLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>('/api/leaderboards/friends');
  }

  getGlobalLeaderboard(limit = 100): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/api/leaderboards/global?limit=${limit}`);
  }

  getWeeklyLeaderboard(limit = 50): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/api/leaderboards/weekly?limit=${limit}`);
  }
}
