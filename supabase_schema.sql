-- ==========================================
-- DISCIPLINE OS - SUPABASE / POSTGRESQL SCHEMA
-- Complete turnkey schema with Row Level Security (RLS)
-- ==========================================

-- 1. PROFILES & USER SETTINGS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT 'Commander',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_target_pct INTEGER DEFAULT 80,
  grace_period_mins INTEGER DEFAULT 10,
  repeat_reminder_mins INTEGER DEFAULT 15,
  morning_brief_time TEXT DEFAULT '07:00',
  evening_summary_time TEXT DEFAULT '21:30',
  sound_enabled BOOLEAN DEFAULT true,
  sound_choice TEXT DEFAULT 'tactical_chime',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TEXT DEFAULT '23:00',
  quiet_hours_end TEXT DEFAULT '06:00',
  push_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROUTINES
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL, -- 'HH:MM' 24hr format
  category TEXT NOT NULL CHECK (category IN ('Study', 'Exercise', 'Health', 'Personal Growth', 'Work', 'Other')),
  description TEXT DEFAULT '',
  repeat_type TEXT NOT NULL CHECK (repeat_type IN ('daily', 'weekdays', 'specific_dates')),
  repeat_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Mon, 7=Sun
  specific_dates TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'YYYY-MM-DD'
  order_index INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROUTINE COMPLETIONS
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'pending')),
  scheduled_time TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  on_time BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, routine_id, date)
);

-- 4. DAILY STREAK SUMMARY
CREATE TABLE IF NOT EXISTS daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  planned_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  missed_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0.00,
  discipline_score NUMERIC(5,2) DEFAULT 0.00,
  met_target BOOLEAN DEFAULT false,
  running_overall_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 5. WEB PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATION LOG
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and manage their own profiles"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only manage their own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own routines"
  ON routines FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only manage their own routine completions"
  ON routine_completions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their daily streaks"
  ON daily_streaks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their push subscriptions"
  ON web_push_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their notification logs"
  ON notification_logs FOR ALL USING (auth.uid() = user_id);

-- INDEXES FOR FAST TIME-SERIES & TIMELINE QUERYING
CREATE INDEX IF NOT EXISTS idx_routines_user_order ON routines(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON routine_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_completions_routine_date ON routine_completions(routine_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_date ON daily_streaks(user_id, date);
