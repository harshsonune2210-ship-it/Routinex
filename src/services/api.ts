import { Routine, DashboardStats, TimelineItem, UserSettings, NotificationRecord, Milestone, UserProfile } from '../types';

let currentUserId = localStorage.getItem('discipline_user_id') || 'user-sonu-master';

export function setApiUserId(id: string) {
  currentUserId = id;
  localStorage.setItem('discipline_user_id', id);
}

export function getApiUserId(): string {
  return currentUserId;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = 'Request failed';
    try {
      const errData = await response.json();
      errMessage = errData.error || errMessage;
    } catch {
      errMessage = response.statusText || errMessage;
    }
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setApiUserId(res.user.id);
    return res;
  },

  async register(email: string, password: string, name: string, timezone: string): Promise<{ user: UserProfile; token: string }> {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, timezone }),
    });
    setApiUserId(res.user.id);
    return res;
  },

  // Dashboard
  async getDashboard(dateStr?: string): Promise<{
    date: string;
    timeline: TimelineItem[];
    stats: DashboardStats;
    settings: UserSettings;
  }> {
    const url = dateStr ? `/api/dashboard?date=${dateStr}` : '/api/dashboard';
    return request(url);
  },

  // Routines
  async getRoutines(): Promise<{ routines: Routine[] }> {
    return request('/api/routines');
  },

  async createRoutine(routine: Partial<Routine>): Promise<{ routine: Routine }> {
    return request('/api/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    });
  },

  async updateRoutine(id: string, partial: Partial<Routine>): Promise<{ routine: Routine }> {
    return request(`/api/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial),
    });
  },

  async deleteRoutine(id: string): Promise<{ success: boolean }> {
    return request(`/api/routines/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderRoutines(routineIds: string[]): Promise<{ routines: Routine[] }> {
    return request('/api/routines/reorder', {
      method: 'POST',
      body: JSON.stringify({ routine_ids: routineIds }),
    });
  },

  // Completions
  async setStatus(
    routineId: string,
    date: string,
    status: 'completed' | 'missed' | 'pending',
    actualCompletionTime?: string | null,
    notes?: string
  ): Promise<{ completion: any; stats: DashboardStats }> {
    return request('/api/completions/status', {
      method: 'POST',
      body: JSON.stringify({
        routine_id: routineId,
        date,
        status,
        actual_completion_time: actualCompletionTime,
        notes,
      }),
    });
  },

  // Calendar
  async getCalendarMonth(year: number, month: number): Promise<{
    year: number;
    month: number;
    days: { [date: string]: any };
  }> {
    return request(`/api/calendar/month?year=${year}&month=${month}`);
  },

  // Analytics
  async getAnalytics(): Promise<{
    trend_14_days: Array<{ date: string; day: string; planned: number; completed: number; missed: number; rate: number; discipline_score: number }>;
    category_breakdown: Array<{ category: string; routine_count: number; total_completions: number }>;
    best_routines: Array<any>;
    most_missed: Array<any>;
    routine_performance: Array<any>;
  }> {
    return request('/api/analytics');
  },

  // Streaks & Milestones
  async getStreaks(): Promise<{
    overall_current_streak: number;
    overall_longest_streak: number;
    milestones: Milestone[];
    heatmap_90_days: Array<{ date: string; count: number; met_target: boolean; score: number }>;
    routine_streaks: Array<{ id: string; name: string; category: string; current_streak: number; longest_streak: number }>;
  }> {
    return request('/api/streaks');
  },

  // Settings
  async getSettings(): Promise<{ settings: UserSettings }> {
    return request('/api/settings');
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
    return request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationRecord[] }> {
    return request('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request('/api/notifications/read-all', { method: 'POST' });
  },

  async testPush(): Promise<{ success: boolean; notification: NotificationRecord }> {
    return request('/api/push/test', { method: 'POST' });
  },

  // Presets
  async resetPresets(): Promise<{ success: boolean }> {
    return request('/api/presets/reset', { method: 'POST' });
  },

  async clearData(): Promise<{ success: boolean }> {
    return request('/api/presets/clear', { method: 'POST' });
  },
};
