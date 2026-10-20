import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db';
import { scheduler, getPublicVapidKey } from './server/scheduler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Simple Auth Middleware using Header x-user-id or fallback to default user
function getAuthUserId(req: express.Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && headerUserId.trim()) {
    return headerUserId.trim();
  }
  // Default first user if not passed
  return 'user-sonu-master';
}

// ================= API ROUTES =================

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.findUserByEmail(email);
  if (!user || !db.verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid credentials. Check email and password.' });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
    token: `token_${user.id}`,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, timezone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = db.createUser(email, password, name || 'User', timezone);
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      },
      token: `token_${user.id}`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const userId = getAuthUserId(req);
  const user = db.findUserById(userId);
  if (!user) {
    // If not found, return default Sonu user
    const defaultUser = db.findUserById('user-sonu-master');
    return res.json({ user: defaultUser });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
  });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const userId = getAuthUserId(req);
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const data = db.getDashboardData(userId, dateStr);
  return res.json(data);
});

// Routines CRUD
app.get('/api/routines', (req, res) => {
  const userId = getAuthUserId(req);
  const routines = db.getRoutines(userId);
  return res.json({ routines });
});

app.post('/api/routines', (req, res) => {
  const userId = getAuthUserId(req);
  const { name, scheduled_time, category, description, repeat_type, repeat_days, specific_dates } = req.body;

  if (!name || !scheduled_time || !category) {
    return res.status(400).json({ error: 'Name, scheduled time, and category are required' });
  }

  const routine = db.addRoutine(userId, {
    name,
    scheduled_time,
    category,
    description: description || '',
    repeat_type: repeat_type || 'daily',
    repeat_days: Array.isArray(repeat_days) ? repeat_days : [1, 2, 3, 4, 5, 6, 7],
    specific_dates: Array.isArray(specific_dates) ? specific_dates : [],
    order_index: (db.getRoutines(userId).length),
  });

  return res.status(201).json({ routine });
});

app.put('/api/routines/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const { id } = req.params;
  const updated = db.updateRoutine(userId, id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  return res.json({ routine: updated });
});

app.delete('/api/routines/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const { id } = req.params;
  const success = db.deleteRoutine(userId, id);
  if (!success) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  return res.json({ success: true });
});

app.post('/api/routines/reorder', (req, res) => {
  const userId = getAuthUserId(req);
  const { routine_ids } = req.body;
  if (!Array.isArray(routine_ids)) {
    return res.status(400).json({ error: 'routine_ids must be an array' });
  }
  const reordered = db.reorderRoutines(userId, routine_ids);
  return res.json({ routines: reordered });
});

// Completions / Status Change
app.post('/api/completions/status', (req, res) => {
  const userId = getAuthUserId(req);
  const { routine_id, date, status, actual_completion_time, notes } = req.body;

  if (!routine_id || !date || !status) {
    return res.status(400).json({ error: 'routine_id, date, and status are required' });
  }

  try {
    const completion = db.setRoutineStatus(
      userId,
      routine_id,
      date,
      status,
      actual_completion_time,
      notes
    );
    const updatedDashboard = db.getDashboardData(userId, date);
    return res.json({ completion, stats: updatedDashboard.stats });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update status' });
  }
});

// Calendar Month View
app.get('/api/calendar/month', (req, res) => {
  const userId = getAuthUserId(req);
  const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);

  const routines = db.getRoutines(userId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthData: { [date: string]: any } = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const planned = routines.filter(r => db.isRoutineScheduledOnDate(r, dStr));
    const comps = db.getCompletionsForDate(userId, dStr);

    const completed = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'completed')).length;
    const missed = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'missed')).length;
    const pending = planned.length - completed - missed;

    const rate = planned.length > 0 ? Math.round((completed / planned.length) * 100) : 100;

    monthData[dStr] = {
      date: dStr,
      planned_count: planned.length,
      completed_count: completed,
      missed_count: missed,
      pending_count: pending,
      completion_rate: rate,
      tasks: planned.map(r => {
        const c = comps.find(comp => comp.routine_id === r.id);
        return {
          routine_id: r.id,
          name: r.name,
          category: r.category,
          scheduled_time: r.scheduled_time,
          status: c ? c.status : 'pending',
          on_time: c ? c.on_time : true,
          completed_at: c?.completed_at || null,
        };
      }),
    };
  }

  return res.json({ year, month, days: monthData });
});

// Analytics & Statistics
app.get('/api/analytics', (req, res) => {
  const userId = getAuthUserId(req);
  const routines = db.getRoutines(userId);

  // 1. Last 14 days trend
  const trend: Array<{ date: string; day: string; planned: number; completed: number; missed: number; rate: number; discipline_score: number }> = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const planned = routines.filter(r => db.isRoutineScheduledOnDate(r, dateStr));
    const comps = db.getCompletionsForDate(userId, dateStr);

    const completed = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'completed')).length;
    const onTime = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'completed' && c.on_time)).length;
    const missed = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'missed')).length;

    const rate = planned.length > 0 ? Math.round((completed / planned.length) * 100) : 100;
    const punctuality = completed > 0 ? (onTime / completed) * 100 : 100;
    const score = planned.length > 0 ? Math.round(rate * 0.7 + punctuality * 0.3) : 100;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    trend.push({
      date: dateStr,
      day: `${dayName} ${d.getDate()}`,
      planned: planned.length,
      completed,
      missed,
      rate,
      discipline_score: score,
    });
  }

  // 2. Category Breakdown
  const categories = ['Exercise', 'Study', 'Work', 'Health', 'Personal Growth', 'Other'] as const;
  const categoryStats = categories.map(cat => {
    const catRoutines = routines.filter(r => r.category === cat);
    const routineIds = new Set(catRoutines.map(r => r.id));
    const catCompletions = (db as any).data.completions.filter(
      (c: any) => c.user_id === userId && routineIds.has(c.routine_id) && c.status === 'completed'
    ).length;

    return {
      category: cat,
      routine_count: catRoutines.length,
      total_completions: catCompletions,
    };
  });

  // 3. Best Performing Routines & Missed Patterns
  const routinePerformance = routines.map(routine => {
    const routineComps = (db as any).data.completions.filter(
      (c: any) => c.user_id === userId && c.routine_id === routine.id
    );
    const completed = routineComps.filter((c: any) => c.status === 'completed').length;
    const missed = routineComps.filter((c: any) => c.status === 'missed').length;
    const onTime = routineComps.filter((c: any) => c.status === 'completed' && c.on_time).length;

    const punctualityPct = completed > 0 ? Math.round((onTime / completed) * 100) : 100;

    return {
      routine_id: routine.id,
      name: routine.name,
      category: routine.category,
      scheduled_time: routine.scheduled_time,
      completed_count: completed,
      missed_count: missed,
      current_streak: routine.current_streak,
      longest_streak: routine.longest_streak,
      punctuality_pct: punctualityPct,
    };
  });

  const bestRoutines = [...routinePerformance].sort((a, b) => b.completed_count - a.completed_count).slice(0, 5);
  const mostMissed = [...routinePerformance].sort((a, b) => b.missed_count - a.missed_count).slice(0, 5);

  return res.json({
    trend_14_days: trend,
    category_breakdown: categoryStats,
    best_routines: bestRoutines,
    most_missed: mostMissed,
    routine_performance: routinePerformance,
  });
});

// Streaks & Milestones
app.get('/api/streaks', (req, res) => {
  const userId = getAuthUserId(req);
  const streakData = db.recalculateStreaks(userId);
  const routines = db.getRoutines(userId);

  // 90-day heatmap grid
  const heatmap: Array<{ date: string; count: number; met_target: boolean; score: number }> = [];
  const today = new Date();
  const settings = db.getSettings(userId);

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const planned = routines.filter(r => db.isRoutineScheduledOnDate(r, dateStr));
    const comps = db.getCompletionsForDate(userId, dateStr);
    const completed = planned.filter(r => comps.find(c => c.routine_id === r.id && c.status === 'completed')).length;

    const rate = planned.length > 0 ? Math.round((completed / planned.length) * 100) : 0;
    const metTarget = planned.length > 0 && rate >= (settings.daily_target_pct || 80);

    heatmap.push({
      date: dateStr,
      count: completed,
      met_target: metTarget,
      score: rate,
    });
  }

  // Milestones configuration
  const milestones = [
    { days: 3, title: 'Ignition', desc: 'Break initial resistance and spark the momentum.', icon: '⚡' },
    { days: 7, title: 'Unstoppable Momentum', desc: 'One solid week of non-negotiable execution.', icon: '🔥' },
    { days: 14, title: 'Habit Fortress', desc: 'Two weeks in. The neural pathways are locking in.', icon: '🛡️' },
    { days: 30, title: 'Iron Discipline', desc: 'A full month of uncompromising consistency.', icon: '⚔️' },
    { days: 60, title: 'Master of Will', desc: 'Two months of relentless excellence.', icon: '👑' },
    { days: 100, title: 'Centurion Legend', desc: 'Century mark. A lifestyle transformation achieved.', icon: '🏆' },
  ].map(m => ({
    ...m,
    achieved: streakData.overall_streak >= m.days || streakData.longest_streak >= m.days,
    current_progress: Math.min(100, Math.round((streakData.overall_streak / m.days) * 100)),
  }));

  return res.json({
    overall_current_streak: streakData.overall_streak,
    overall_longest_streak: streakData.longest_streak,
    milestones,
    heatmap_90_days: heatmap,
    routine_streaks: routines.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      current_streak: r.current_streak,
      longest_streak: r.longest_streak,
    })),
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  const userId = getAuthUserId(req);
  const settings = db.getSettings(userId);
  return res.json({ settings });
});

app.put('/api/settings', (req, res) => {
  const userId = getAuthUserId(req);
  const updated = db.updateSettings(userId, req.body);
  return res.json({ settings: updated });
});

// Push & Notifications
app.get('/api/push/vapid-key', (_req, res) => {
  return res.json({ publicKey: getPublicVapidKey() });
});

app.post('/api/push/subscribe', (req, res) => {
  const userId = getAuthUserId(req);
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid push subscription required' });
  }

  db.savePushSubscription(userId, subscription);
  return res.json({ success: true, message: 'Web push subscription registered' });
});

app.post('/api/push/test', async (req, res) => {
  const userId = getAuthUserId(req);
  const notif = await scheduler.sendNotificationToUser(userId, {
    title: '⚡ DISCIPLINE OS: Tactical Ping',
    body: 'Test notification verified. Scheduled reminders & grace alerts are active!',
    type: 'task_due',
  });
  return res.json({ success: true, notification: notif });
});

app.get('/api/notifications', (req, res) => {
  const userId = getAuthUserId(req);
  const notifications = db.getNotifications(userId);
  return res.json({ notifications });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const userId = getAuthUserId(req);
  const { id } = req.params;
  db.markNotificationRead(userId, id);
  return res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const userId = getAuthUserId(req);
  db.markAllNotificationsRead(userId);
  return res.json({ success: true });
});

// Presets
app.post('/api/presets/reset', (req, res) => {
  const userId = getAuthUserId(req);
  db.resetToSamplePresets(userId);
  return res.json({ success: true, message: 'Sample routines restored' });
});

app.post('/api/presets/clear', (req, res) => {
  const userId = getAuthUserId(req);
  db.clearAllUserData(userId);
  return res.json({ success: true, message: 'User routines cleared' });
});

// Start scheduler background loop
scheduler.start();

// Vite Middleware integration in dev, or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DISCIPLINE OS] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[DISCIPLINE OS] Failed to start server:', err);
});
