export type RoutineCategory = 'Study' | 'Exercise' | 'Health' | 'Personal Growth' | 'Work' | 'Other';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  scheduled_time: string; // HH:MM
  category: RoutineCategory;
  description: string;
  repeat_type: 'daily' | 'weekdays' | 'specific_dates';
  repeat_days: number[]; // 1=Mon ... 7=Sun
  specific_dates: string[];
  order_index: number;
  current_streak: number;
  longest_streak: number;
  is_archived: boolean;
  created_at: string;
}

export interface TimelineItem {
  routine: Routine;
  status: 'completed' | 'missed' | 'pending';
  completed_at: string | null;
  on_time: boolean;
  notes: string;
}

export interface DashboardStats {
  total_planned: number;
  completed: number;
  missed: number;
  pending: number;
  progress_pct: number;
  discipline_score: number;
  current_streak: number;
  longest_streak: number;
  weekly_completion_rate: number;
  total_completed_all_time: number;
  daily_target_pct: number;
}

export interface UserSettings {
  user_id: string;
  daily_target_pct: number;
  grace_period_mins: number;
  repeat_reminder_mins: number;
  morning_brief_time: string;
  evening_summary_time: string;
  sound_enabled: boolean;
  sound_choice: 'tactical_chime' | 'radar' | 'bell' | 'electronic';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  push_enabled: boolean;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  routine_id?: string;
  type: 'task_due' | 'grace_warning' | 'repeat_reminder' | 'morning_brief' | 'evening_summary' | 'milestone';
  title: string;
  body: string;
  sent_at: string;
  read: boolean;
}

export interface Milestone {
  days: number;
  title: string;
  desc: string;
  icon: string;
  achieved: boolean;
  current_progress: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  timezone: string;
}
