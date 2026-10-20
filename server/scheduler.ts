import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { db } from './db';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const VAPID_FILE = path.resolve(DATA_DIR, 'vapid.json');

let vapidKeys: VapidKeys;

function initVapid(): VapidKeys {
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const content = fs.readFileSync(VAPID_FILE, 'utf-8');
      vapidKeys = JSON.parse(content);
      return vapidKeys;
    } catch {
      // ignore
    }
  }

  // Generate new standard VAPID keypair
  const generated = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
  };

  try {
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Scheduler] Error writing VAPID file:', err);
  }

  return vapidKeys;
}

export function getPublicVapidKey(): string {
  if (!vapidKeys) initVapid();
  return vapidKeys.publicKey;
}

export class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor() {
    initVapid();
    webpush.setVapidDetails(
      'mailto:sonunevaishali14@gmail.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }

  public start() {
    if (this.timer) return;
    console.log('[Scheduler] Background notification engine initialized.');
    // Check every 20 seconds for high punctuality precision
    this.timer = setInterval(() => {
      this.checkAndDispatch();
    }, 20000);

    // Initial check
    setTimeout(() => this.checkAndDispatch(), 2000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async sendNotificationToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: 'task_due' | 'grace_warning' | 'repeat_reminder' | 'morning_brief' | 'evening_summary' | 'milestone';
      routineId?: string;
    }
  ) {
    // 1. Record in DB
    const record = db.addNotification(userId, {
      type: payload.type,
      routine_id: payload.routineId,
      title: payload.title,
      body: payload.body,
    });

    // 2. Dispatch to registered Web Push service workers
    const subscriptions = db.getPushSubscriptions(userId);
    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.routineId ? `routine-${payload.routineId}` : `discipline-${Date.now()}`,
      url: '/',
    });

    const sendPromises = subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          pushData
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or unregistered, prune it
          db.removePushSubscription(sub.endpoint);
        } else {
          console.error('[WebPush] Error sending push notification:', err?.message || err);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    return record;
  }

  private getUserLocalTime(timezone: string): { dateStr: string; timeStr: string; minutesFromMidnight: number } {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value || '2026';
      const month = parts.find(p => p.type === 'month')?.value || '10';
      const day = parts.find(p => p.type === 'day')?.value || '20';
      const hour = parts.find(p => p.type === 'hour')?.value || '00';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';

      const dateStr = `${year}-${month}-${day}`;
      const timeStr = `${hour}:${minute}`;
      const minutesFromMidnight = parseInt(hour, 10) * 60 + parseInt(minute, 10);

      return { dateStr, timeStr, minutesFromMidnight };
    } catch {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return {
        dateStr,
        timeStr: `${hours}:${minutes}`,
        minutesFromMidnight: now.getHours() * 60 + now.getMinutes(),
      };
    }
  }

  private isQuietHour(timeStr: string, quietStart: string, quietEnd: string): boolean {
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const current = toMins(timeStr);
    const start = toMins(quietStart);
    const end = toMins(quietEnd);

    if (start <= end) {
      return current >= start && current < end;
    } else {
      // Over midnight, e.g., 23:00 to 06:00
      return current >= start || current < end;
    }
  }

  private async checkAndDispatch() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      // Fetch all users
      const users = (db as any).data.users;
      for (const user of users) {
        const settings = db.getSettings(user.id);
        if (!settings.push_enabled) continue;

        const { dateStr, timeStr, minutesFromMidnight } = this.getUserLocalTime(user.timezone || 'America/Los_Angeles');

        // Check Quiet Hours
        if (settings.quiet_hours_enabled) {
          if (this.isQuietHour(timeStr, settings.quiet_hours_start, settings.quiet_hours_end)) {
            continue;
          }
        }

        // 1. Morning Brief Notification
        const morningKey = `morning_${user.id}_${dateStr}`;
        if (timeStr === settings.morning_brief_time && !db.hasEventDispatched(morningKey)) {
          const routines = db.getRoutines(user.id);
          const planned = routines.filter(r => db.isRoutineScheduledOnDate(r, dateStr));
          await this.sendNotificationToUser(user.id, {
            title: `🌅 Good Morning, ${user.name}!`,
            body: `You have ${planned.length} routines scheduled today. Execute with relentless discipline!`,
            type: 'morning_brief',
          });
          db.markEventDispatched(morningKey);
        }

        // 2. Evening Summary Notification
        const eveningKey = `evening_${user.id}_${dateStr}`;
        if (timeStr === settings.evening_summary_time && !db.hasEventDispatched(eveningKey)) {
          const dash = db.getDashboardData(user.id, dateStr);
          await this.sendNotificationToUser(user.id, {
            title: `🌙 Daily Debrief (${dash.stats.discipline_score}% Score)`,
            body: `${dash.stats.completed}/${dash.stats.total_planned} tasks completed. Current streak: ${dash.stats.current_streak} days.`,
            type: 'evening_summary',
          });
          db.markEventDispatched(eveningKey);
        }

        // 3. Routines Timeline Checks
        const routines = db.getRoutines(user.id);
        const plannedRoutines = routines.filter(r => db.isRoutineScheduledOnDate(r, dateStr));
        const completions = db.getCompletionsForDate(user.id, dateStr);

        for (const routine of plannedRoutines) {
          const comp = completions.find(c => c.routine_id === routine.id);
          // If task completed, NEVER remind!
          if (comp && comp.status === 'completed') {
            continue;
          }

          const [schedH, schedM] = routine.scheduled_time.split(':').map(Number);
          const schedMinutes = schedH * 60 + schedM;
          const diffMinutes = minutesFromMidnight - schedMinutes;

          // A. Exact Scheduled Time Reminder (+/- 1 min)
          const dueKey = `due_${user.id}_${routine.id}_${dateStr}`;
          if (diffMinutes >= 0 && diffMinutes <= 2 && !db.hasEventDispatched(dueKey)) {
            await this.sendNotificationToUser(user.id, {
              title: `🎯 Scheduled Now: ${routine.name}`,
              body: `Scheduled for ${routine.scheduled_time}. Start now to maintain your on-time streak!`,
              type: 'task_due',
              routineId: routine.id,
            });
            db.markEventDispatched(dueKey);
          }

          // B. Grace Period Expiry Warning
          const graceMins = settings.grace_period_mins || 10;
          const graceKey = `grace_${user.id}_${routine.id}_${dateStr}`;
          if (diffMinutes >= graceMins && diffMinutes <= graceMins + 2 && !db.hasEventDispatched(graceKey)) {
            await this.sendNotificationToUser(user.id, {
              title: `⚠️ Grace Period Ended: ${routine.name}`,
              body: `Scheduled at ${routine.scheduled_time}. Grace period (${graceMins}m) has elapsed! Mark complete now.`,
              type: 'grace_warning',
              routineId: routine.id,
            });
            db.markEventDispatched(graceKey);
          }

          // C. Repeat Reminder interval
          const repeatInterval = settings.repeat_reminder_mins || 15;
          if (diffMinutes > graceMins && diffMinutes <= 180) {
            const reminderIndex = Math.floor((diffMinutes - graceMins) / repeatInterval);
            if (reminderIndex >= 1 && reminderIndex <= 3) {
              const repeatKey = `repeat_${user.id}_${routine.id}_${dateStr}_#${reminderIndex}`;
              if (!db.hasEventDispatched(repeatKey)) {
                await this.sendNotificationToUser(user.id, {
                  title: `🔥 Stay Consistent: ${routine.name}`,
                  body: `Still pending! Protect your ${routine.current_streak}-day streak before the day ends.`,
                  type: 'repeat_reminder',
                  routineId: routine.id,
                });
                db.markEventDispatched(repeatKey);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error in checkAndDispatch loop:', err);
    } finally {
      this.isChecking = false;
    }
  }
}

export const scheduler = new NotificationScheduler();
