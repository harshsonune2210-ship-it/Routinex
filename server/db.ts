import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  timezone: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  daily_target_pct: number;
  grace_period_mins: number;
  repeat_reminder_mins: number;
  morning_brief_time: string;
  evening_summary_time: string;
  sound_enabled: boolean;
  sound_choice: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  push_enabled: boolean;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  scheduled_time: string; // HH:MM
  category: 'Study' | 'Exercise' | 'Health' | 'Personal Growth' | 'Work' | 'Other';
  description: string;
  repeat_type: 'daily' | 'weekdays' | 'specific_dates';
  repeat_days: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  specific_dates: string[]; // YYYY-MM-DD
  order_index: number;
  current_streak: number;
  longest_streak: number;
  is_archived: boolean;
  created_at: string;
}

export interface RoutineCompletion {
  id: string;
  user_id: string;
  routine_id: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'pending';
  scheduled_time: string;
  completed_at: string | null;
  on_time: boolean;
  notes: string;
  created_at: string;
}

export interface PushSubscriptionData {
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
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

export interface DatabaseSchema {
  users: User[];
  settings: UserSettings[];
  routines: Routine[];
  completions: RoutineCompletion[];
  push_subscriptions: PushSubscriptionData[];
  notifications: NotificationRecord[];
  dispatched_events: { [key: string]: boolean };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'discipline_os.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_discipline_salt').digest('hex');
}

export class DBStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.seedDefaultIfEmpty();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing clean database:', err);
    }
    return {
      users: [],
      settings: [],
      routines: [],
      completions: [],
      push_subscriptions: [],
      notifications: [],
      dispatched_events: {},
    };
  }

  public save(): void {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to save database file:', err);
    }
  }

  private seedDefaultIfEmpty() {
    if (this.data.users.length === 0) {
      const defaultUserId = 'user-sonu-master';
      const sonuUser: User = {
        id: defaultUserId,
        email: 'sonunevaishali14@gmail.com',
        password_hash: hashPassword('discipline123'),
        name: 'Sonu',
        timezone: 'America/Los_Angeles',
        created_at: new Date().toISOString(),
      };

      const sonuSettings: UserSettings = {
        user_id: defaultUserId,
        daily_target_pct: 80,
        grace_period_mins: 10,
        repeat_reminder_mins: 15,
        morning_brief_time: '07:00',
        evening_summary_time: '21:30',
        sound_enabled: true,
        sound_choice: 'tactical_chime',
        quiet_hours_enabled: false,
        quiet_hours_start: '23:00',
        quiet_hours_end: '06:00',
        push_enabled: true,
      };

      this.data.users.push(sonuUser);
      this.data.settings.push(sonuSettings);

      const sampleRoutines: Omit<Routine, 'id' | 'user_id' | 'current_streak' | 'longest_streak' | 'is_archived' | 'created_at'>[] = [
        {
          name: 'Morning Hydration & Sunlight',
          scheduled_time: '06:45',
          category: 'Health',
          description: '500ml water with electrolytes + 10 mins natural sunlight for circadian rhythm.',
          repeat_type: 'daily',
          repeat_days: [1, 2, 3, 4, 5, 6, 7],
          specific_dates: [],
          order_index: 0,
        },
        {
          name: 'High Intensity Physical Training',
          scheduled_time: '07:15',
          category: 'Exercise',
          description: 'Weightlifting or 5km run. Non-negotiable physical capacity building.',
          repeat_type: 'weekdays',
          repeat_days: [1, 2, 3, 4, 5, 6],
          specific_dates: [],
          order_index: 1,
        },
        {
          name: 'Deep Work Sprint: Focus Block 1',
          scheduled_time: '09:00',
          category: 'Work',
          description: 'Zero distractions, phone in airplane mode, core project execution.',
          repeat_type: 'weekdays',
          repeat_days: [1, 2, 3, 4, 5],
          specific_dates: [],
          order_index: 2,
        },
        {
          name: 'Nutritional Meal & 15m Walk',
          scheduled_time: '13:00',
          category: 'Health',
          description: 'High-protein whole foods followed by an active metabolic stroll.',
          repeat_type: 'daily',
          repeat_days: [1, 2, 3, 4, 5, 6, 7],
          specific_dates: [],
          order_index: 3,
        },
        {
          name: 'Technical Mastery & Deep Study',
          scheduled_time: '17:30',
          category: 'Study',
          description: 'Read 20 pages or practice advanced algorithms / systems design.',
          repeat_type: 'daily',
          repeat_days: [1, 2, 3, 4, 5, 6, 7],
          order_index: 4,
          specific_dates: [],
        },
        {
          name: 'Evening Debrief & Tomorrow Setup',
          scheduled_time: '21:30',
          category: 'Personal Growth',
          description: 'Review day discipline score, journal wins and lapses, prepare outfit and priorities.',
          repeat_type: 'daily',
          repeat_days: [1, 2, 3, 4, 5, 6, 7],
          order_index: 5,
          specific_dates: [],
        },
      ];

      sampleRoutines.forEach((r, idx) => {
        const routineId = `routine-${idx + 1}`;
        this.data.routines.push({
          ...r,
          id: routineId,
          user_id: defaultUserId,
          current_streak: idx % 2 === 0 ? 5 : 8,
          longest_streak: 14,
          is_archived: false,
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        });
      });

      // Populate sample completions for the past 7 days to give instant rich analytics and streaks
      const today = new Date();
      for (let i = 6; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        this.data.routines.forEach((routine, rIdx) => {
          // Mostly completed to show momentum
          const isDone = !(i === 3 && rIdx === 4); // occasional miss
          this.data.completions.push({
            id: `comp-${dateStr}-${routine.id}`,
            user_id: defaultUserId,
            routine_id: routine.id,
            date: dateStr,
            status: isDone ? 'completed' : 'missed',
            scheduled_time: routine.scheduled_time,
            completed_at: isDone ? `${dateStr}T${routine.scheduled_time}:00.000Z` : null,
            on_time: isDone && (i !== 2 || rIdx !== 1),
            notes: isDone ? 'Executed with focus' : 'Overrun with meeting',
            created_at: `${dateStr}T${routine.scheduled_time}:00.000Z`,
          });
        });
      }

      this.save();
    }
  }

  // User & Auth Methods
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, password: string, name: string, timezone: string = 'America/Los_Angeles'): User {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('User already exists with this email');
    }
    const user: User = {
      id: `usr_${crypto.randomUUID()}`,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      name: name || 'Commander',
      timezone: timezone || 'America/Los_Angeles',
      created_at: new Date().toISOString(),
    };
    this.data.users.push(user);

    const settings: UserSettings = {
      user_id: user.id,
      daily_target_pct: 80,
      grace_period_mins: 10,
      repeat_reminder_mins: 15,
      morning_brief_time: '07:00',
      evening_summary_time: '21:30',
      sound_enabled: true,
      sound_choice: 'tactical_chime',
      quiet_hours_enabled: false,
      quiet_hours_start: '23:00',
      quiet_hours_end: '06:00',
      push_enabled: true,
    };
    this.data.settings.push(settings);

    this.save();
    return user;
  }

  public verifyPassword(user: User, password: string): boolean {
    return user.password_hash === hashPassword(password);
  }

  public getSettings(userId: string): UserSettings {
    let settings = this.data.settings.find(s => s.user_id === userId);
    if (!settings) {
      settings = {
        user_id: userId,
        daily_target_pct: 80,
        grace_period_mins: 10,
        repeat_reminder_mins: 15,
        morning_brief_time: '07:00',
        evening_summary_time: '21:30',
        sound_enabled: true,
        sound_choice: 'tactical_chime',
        quiet_hours_enabled: false,
        quiet_hours_start: '23:00',
        quiet_hours_end: '06:00',
        push_enabled: true,
      };
      this.data.settings.push(settings);
      this.save();
    }
    return settings;
  }

  public updateSettings(userId: string, partial: Partial<UserSettings>): UserSettings {
    const current = this.getSettings(userId);
    Object.assign(current, partial);
    this.save();
    return current;
  }

  // Routines CRUD
  public getRoutines(userId: string): Routine[] {
    return this.data.routines
      .filter(r => r.user_id === userId && !r.is_archived)
      .sort((a, b) => a.order_index - b.order_index);
  }

  public addRoutine(userId: string, routineData: Omit<Routine, 'id' | 'user_id' | 'current_streak' | 'longest_streak' | 'is_archived' | 'created_at'>): Routine {
    const newRoutine: Routine = {
      ...routineData,
      id: `rt_${crypto.randomUUID()}`,
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    this.data.routines.push(newRoutine);
    this.save();
    return newRoutine;
  }

  public updateRoutine(userId: string, routineId: string, partial: Partial<Routine>): Routine | null {
    const routine = this.data.routines.find(r => r.id === routineId && r.user_id === userId);
    if (!routine) return null;
    Object.assign(routine, partial);
    this.save();
    return routine;
  }

  public deleteRoutine(userId: string, routineId: string): boolean {
    const idx = this.data.routines.findIndex(r => r.id === routineId && r.user_id === userId);
    if (idx !== -1) {
      this.data.routines.splice(idx, 1);
      // Remove completions for this routine as well
      this.data.completions = this.data.completions.filter(c => c.routine_id !== routineId);
      this.save();
      return true;
    }
    return false;
  }

  public reorderRoutines(userId: string, routineIds: string[]): Routine[] {
    routineIds.forEach((id, index) => {
      const routine = this.data.routines.find(r => r.id === id && r.user_id === userId);
      if (routine) {
        routine.order_index = index;
      }
    });
    this.save();
    return this.getRoutines(userId);
  }

  // Completions & Timeline
  public isRoutineScheduledOnDate(routine: Routine, dateStr: string): boolean {
    if (routine.repeat_type === 'daily') return true;

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const jsDay = dateObj.getDay();
    // In our system: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    const isoDay = jsDay === 0 ? 7 : jsDay;

    if (routine.repeat_type === 'weekdays') {
      return (routine.repeat_days || [1, 2, 3, 4, 5]).includes(isoDay);
    }

    if (routine.repeat_type === 'specific_dates') {
      return (routine.specific_dates || []).includes(dateStr);
    }

    return true;
  }

  public getCompletionsForDate(userId: string, dateStr: string): RoutineCompletion[] {
    return this.data.completions.filter(c => c.user_id === userId && c.date === dateStr);
  }

  public setRoutineStatus(
    userId: string,
    routineId: string,
    dateStr: string,
    status: 'completed' | 'missed' | 'pending',
    actualCompletionTime?: string | null,
    notes?: string
  ): RoutineCompletion {
    const routine = this.data.routines.find(r => r.id === routineId && r.user_id === userId);
    if (!routine) throw new Error('Routine not found');

    const settings = this.getSettings(userId);
    let completion = this.data.completions.find(
      c => c.user_id === userId && c.routine_id === routineId && c.date === dateStr
    );

    const now = new Date();
    const completedAt = status === 'completed'
      ? (actualCompletionTime || now.toISOString())
      : null;

    // Determine punctuality
    let isOnTime = true;
    if (status === 'completed' && completedAt) {
      try {
        const compDate = new Date(completedAt);
        const [schedHours, schedMins] = routine.scheduled_time.split(':').map(Number);
        const schedDate = new Date(dateStr + 'T' + routine.scheduled_time + ':00');
        const graceMs = (settings.grace_period_mins || 10) * 60 * 1000;
        isOnTime = compDate.getTime() <= schedDate.getTime() + graceMs;
      } catch {
        isOnTime = true;
      }
    }

    if (completion) {
      completion.status = status;
      completion.completed_at = completedAt;
      completion.on_time = isOnTime;
      if (notes !== undefined) completion.notes = notes;
    } else {
      completion = {
        id: `cmp_${crypto.randomUUID()}`,
        user_id: userId,
        routine_id: routineId,
        date: dateStr,
        status,
        scheduled_time: routine.scheduled_time,
        completed_at: completedAt,
        on_time: isOnTime,
        notes: notes || '',
        created_at: now.toISOString(),
      };
      this.data.completions.push(completion);
    }

    // Recalculate streaks
    this.recalculateStreaks(userId);
    this.save();
    return completion;
  }

  public recalculateStreaks(userId: string): { overall_streak: number; longest_streak: number } {
    const routines = this.getRoutines(userId);
    const settings = this.getSettings(userId);
    const targetPct = settings.daily_target_pct || 80;

    // 1. Recalculate individual routine streaks
    routines.forEach(routine => {
      let streak = 0;
      let maxStreak = routine.longest_streak || 0;

      // Check dates going back 180 days
      const d = new Date();
      let consecutive = 0;

      for (let i = 0; i < 180; i++) {
        const checkDate = new Date(d);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const isScheduled = this.isRoutineScheduledOnDate(routine, dateStr);
        if (!isScheduled) {
          // Rest days do NOT break streak!
          continue;
        }

        const comp = this.data.completions.find(
          c => c.user_id === userId && c.routine_id === routine.id && c.date === dateStr
        );

        if (comp && comp.status === 'completed') {
          consecutive++;
          if (consecutive > maxStreak) maxStreak = consecutive;
        } else {
          // If it's today and not yet completed, don't break yesterday's streak yet
          if (i === 0) {
            continue;
          }
          // Scheduled day missed!
          break;
        }
      }

      streak = consecutive;
      routine.current_streak = streak;
      routine.longest_streak = Math.max(maxStreak, streak);
    });

    // 2. Recalculate overall daily streak
    let overallCurrentStreak = 0;
    let overallLongestStreak = 0;
    let tempStreak = 0;

    const todayDate = new Date();
    for (let i = 0; i < 180; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const plannedRoutines = routines.filter(r => this.isRoutineScheduledOnDate(r, dateStr));
      if (plannedRoutines.length === 0) {
        // Complete rest day does not reset streak
        continue;
      }

      const dayCompletions = this.getCompletionsForDate(userId, dateStr);
      const completedCount = plannedRoutines.filter(r => {
        const c = dayCompletions.find(comp => comp.routine_id === r.id);
        return c && c.status === 'completed';
      }).length;

      const completionPct = (completedCount / plannedRoutines.length) * 100;
      const metTarget = completionPct >= targetPct;

      if (metTarget) {
        tempStreak++;
        if (tempStreak > overallLongestStreak) overallLongestStreak = tempStreak;
      } else {
        if (i === 0) {
          // Today in progress, keep yesterday's streak alive
          continue;
        }
        break;
      }
    }

    overallCurrentStreak = tempStreak;
    return {
      overall_streak: overallCurrentStreak,
      longest_streak: overallLongestStreak,
    };
  }

  public getDashboardData(userId: string, dateStr: string) {
    const routines = this.getRoutines(userId);
    const settings = this.getSettings(userId);
    const completions = this.getCompletionsForDate(userId, dateStr);

    const plannedRoutines = routines.filter(r => this.isRoutineScheduledOnDate(r, dateStr));

    const timeline = plannedRoutines.map(routine => {
      const comp = completions.find(c => c.routine_id === routine.id);
      let status: 'completed' | 'missed' | 'pending' = 'pending';
      let completedAt = null;
      let onTime = true;
      let notes = '';

      if (comp) {
        status = comp.status;
        completedAt = comp.completed_at;
        onTime = comp.on_time;
        notes = comp.notes;
      } else {
        // Evaluate if overdue/missed based on time
        const [h, m] = routine.scheduled_time.split(':').map(Number);
        const schedTimeToday = new Date(dateStr + 'T' + routine.scheduled_time + ':00');
        const now = new Date();
        const graceMs = (settings.grace_period_mins || 10) * 60 * 1000;
        if (now.getTime() > schedTimeToday.getTime() + graceMs && dateStr < now.toISOString().split('T')[0]) {
          status = 'missed';
        }
      }

      return {
        routine,
        status,
        completed_at: completedAt,
        on_time: onTime,
        notes,
      };
    });

    const completedCount = timeline.filter(t => t.status === 'completed').length;
    const missedCount = timeline.filter(t => t.status === 'missed').length;
    const pendingCount = timeline.filter(t => t.status === 'pending').length;
    const totalPlanned = plannedRoutines.length;
    const progressPct = totalPlanned > 0 ? Math.round((completedCount / totalPlanned) * 100) : 100;

    // Calculate Discipline Score (100-point scale: 70% completion volume + 30% punctuality)
    const onTimeCount = timeline.filter(t => t.status === 'completed' && t.on_time).length;
    const punctualityRate = completedCount > 0 ? onTimeCount / completedCount : 1;
    const disciplineScore = totalPlanned > 0
      ? Math.round((progressPct * 0.7) + (punctualityRate * 100 * 0.3))
      : 100;

    const streakData = this.recalculateStreaks(userId);

    // Calculate weekly completion rate (last 7 days)
    let weeklyPlanned = 0;
    let weeklyCompleted = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayPlanned = routines.filter(r => this.isRoutineScheduledOnDate(r, dStr));
      const dayComps = this.getCompletionsForDate(userId, dStr);
      weeklyPlanned += dayPlanned.length;
      weeklyCompleted += dayPlanned.filter(r => {
        const c = dayComps.find(comp => comp.routine_id === r.id);
        return c && c.status === 'completed';
      }).length;
    }
    const weeklyRate = weeklyPlanned > 0 ? Math.round((weeklyCompleted / weeklyPlanned) * 100) : 100;

    // Total all-time completed tasks
    const totalAllTimeCompleted = this.data.completions.filter(
      c => c.user_id === userId && c.status === 'completed'
    ).length;

    return {
      date: dateStr,
      timeline,
      stats: {
        total_planned: totalPlanned,
        completed: completedCount,
        missed: missedCount,
        pending: pendingCount,
        progress_pct: progressPct,
        discipline_score: disciplineScore,
        current_streak: streakData.overall_streak,
        longest_streak: streakData.longest_streak,
        weekly_completion_rate: weeklyRate,
        total_completed_all_time: totalAllTimeCompleted,
        daily_target_pct: settings.daily_target_pct,
      },
      settings,
    };
  }

  // Push subscriptions
  public savePushSubscription(userId: string, subscription: any) {
    const existing = this.data.push_subscriptions.find(p => p.endpoint === subscription.endpoint);
    if (existing) {
      existing.user_id = userId;
      existing.keys = subscription.keys;
    } else {
      this.data.push_subscriptions.push({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        created_at: new Date().toISOString(),
      });
    }
    this.save();
  }

  public getPushSubscriptions(userId: string) {
    return this.data.push_subscriptions.filter(p => p.user_id === userId);
  }

  public removePushSubscription(endpoint: string) {
    this.data.push_subscriptions = this.data.push_subscriptions.filter(p => p.endpoint !== endpoint);
    this.save();
  }

  // Notifications Log
  public addNotification(userId: string, record: Omit<NotificationRecord, 'id' | 'sent_at' | 'read' | 'user_id'>): NotificationRecord {
    const notif: NotificationRecord = {
      ...record,
      user_id: userId,
      id: `nt_${crypto.randomUUID()}`,
      sent_at: new Date().toISOString(),
      read: false,
    };
    this.data.notifications.unshift(notif);
    // keep maximum 100 records per user
    this.data.notifications = this.data.notifications.slice(0, 200);
    this.save();
    return notif;
  }

  public getNotifications(userId: string): NotificationRecord[] {
    return this.data.notifications.filter(n => n.user_id === userId).slice(0, 30);
  }

  public markNotificationRead(userId: string, notificationId: string): void {
    const n = this.data.notifications.find(item => item.id === notificationId && item.user_id === userId);
    if (n) {
      n.read = true;
      this.save();
    }
  }

  public markAllNotificationsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.user_id === userId) n.read = true;
    });
    this.save();
  }

  // Event dispatch tracking to prevent duplicate notification firing
  public hasEventDispatched(eventKey: string): boolean {
    return !!this.data.dispatched_events[eventKey];
  }

  public markEventDispatched(eventKey: string): void {
    this.data.dispatched_events[eventKey] = true;
    this.save();
  }

  // Sample data management
  public resetToSamplePresets(userId: string) {
    // Delete existing routines and completions for this user
    this.data.routines = this.data.routines.filter(r => r.user_id !== userId);
    this.data.completions = this.data.completions.filter(c => c.user_id !== userId);

    const presetRoutines = [
      { name: 'Morning Hydration & Sunlight', scheduled_time: '06:45', category: 'Health' as const, description: '500ml water with electrolytes + 10 mins natural sunlight.', repeat_type: 'daily' as const, repeat_days: [1,2,3,4,5,6,7], specific_dates: [], order_index: 0 },
      { name: 'High Intensity Physical Training', scheduled_time: '07:15', category: 'Exercise' as const, description: 'Weight training or 5k tempo run.', repeat_type: 'weekdays' as const, repeat_days: [1,2,3,4,5,6], specific_dates: [], order_index: 1 },
      { name: 'Deep Work Sprint: Focus Block 1', scheduled_time: '09:00', category: 'Work' as const, description: 'No notifications, phone in airplane mode, high-leverage deliverables.', repeat_type: 'weekdays' as const, repeat_days: [1,2,3,4,5], specific_dates: [], order_index: 2 },
      { name: 'Nutritional Meal & 15m Walk', scheduled_time: '13:00', category: 'Health' as const, description: 'High-protein lunch + low-intensity digestion walk.', repeat_type: 'daily' as const, repeat_days: [1,2,3,4,5,6,7], specific_dates: [], order_index: 3 },
      { name: 'Technical Mastery & Deep Study', scheduled_time: '17:30', category: 'Study' as const, description: 'Reading technical documentation or architectural design patterns.', repeat_type: 'daily' as const, repeat_days: [1,2,3,4,5,6,7], specific_dates: [], order_index: 4 },
      { name: 'Evening Debrief & Tomorrow Setup', scheduled_time: '21:30', category: 'Personal Growth' as const, description: 'Review discipline score, log insights, prepare workspace for tomorrow.', repeat_type: 'daily' as const, repeat_days: [1,2,3,4,5,6,7], specific_dates: [], order_index: 5 },
    ];

    presetRoutines.forEach((r, idx) => {
      this.data.routines.push({
        ...r,
        id: `rt_preset_${userId}_${idx}`,
        user_id: userId,
        current_streak: 6,
        longest_streak: 15,
        is_archived: false,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      });
    });

    // Populate past 7 days of realistic completions
    const today = new Date();
    for (let i = 6; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      this.data.routines.filter(r => r.user_id === userId).forEach((routine, rIdx) => {
        const isDone = !(i === 2 && rIdx === 4);
        this.data.completions.push({
          id: `cmp_${dateStr}_${routine.id}`,
          user_id: userId,
          routine_id: routine.id,
          date: dateStr,
          status: isDone ? 'completed' : 'missed',
          scheduled_time: routine.scheduled_time,
          completed_at: isDone ? `${dateStr}T${routine.scheduled_time}:00.000Z` : null,
          on_time: isDone && (i !== 3 || rIdx !== 2),
          notes: isDone ? 'Executed according to schedule' : 'Overdue',
          created_at: `${dateStr}T${routine.scheduled_time}:00.000Z`,
        });
      });
    }

    this.recalculateStreaks(userId);
    this.save();
  }

  public clearAllUserData(userId: string) {
    this.data.routines = this.data.routines.filter(r => r.user_id !== userId);
    this.data.completions = this.data.completions.filter(c => c.user_id !== userId);
    this.data.notifications = this.data.notifications.filter(n => n.user_id !== userId);
    this.save();
  }
}

export const db = new DBStore();
