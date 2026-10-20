import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { CalendarPage } from './pages/CalendarPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { StreaksPage } from './pages/StreaksPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddRoutineModal } from './components/AddRoutineModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { api } from './services/api';
import { DashboardStats, TimelineItem, Routine, UserSettings, NotificationRecord, UserProfile } from './types';
import { soundEngine } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState<UserProfile>({
    id: 'user-sonu-master',
    email: 'sonunevaishali14@gmail.com',
    name: 'Sonu',
    timezone: 'America/Los_Angeles',
  });

  const [stats, setStats] = useState<DashboardStats>({
    total_planned: 6,
    completed: 4,
    missed: 0,
    pending: 2,
    progress_pct: 67,
    discipline_score: 92,
    current_streak: 5,
    longest_streak: 14,
    weekly_completion_rate: 88,
    total_completed_all_time: 48,
    daily_target_pct: 80,
  });

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: 'user-sonu-master',
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
  });

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  const loadDashboard = useCallback(async (date?: string) => {
    try {
      const targetDate = date || selectedDate;
      const res = await api.getDashboard(targetDate);
      setStats(res.stats);
      setTimeline(res.timeline);
      setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, [selectedDate]);

  const loadRoutines = useCallback(async () => {
    try {
      const res = await api.getRoutines();
      setRoutines(res.routines);
    } catch (err) {
      console.error('Failed to load routines:', err);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const userRes = await api.getCurrentUser();
      if (userRes.user) setUser(userRes.user);

      await Promise.all([
        loadDashboard(),
        loadRoutines(),
        loadNotifications(),
      ]);
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadDashboard, loadRoutines, loadNotifications]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Periodic background synchronization every 15s to keep live times & notifications updated
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboard();
      loadNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadDashboard, loadNotifications]);

  // Handle Routine Status Change
  const handleSetStatus = async (
    routineId: string,
    status: 'completed' | 'missed' | 'pending',
    actualTime?: string | null,
    notes?: string
  ) => {
    try {
      const res = await api.setStatus(routineId, selectedDate, status, actualTime, notes);
      setStats(res.stats);
      await Promise.all([
        loadDashboard(selectedDate),
        loadRoutines(),
      ]);
    } catch (err) {
      console.error('Failed to set status:', err);
    }
  };

  // Add / Edit Routine
  const handleSaveRoutine = async (routineData: Partial<Routine>) => {
    if (editingRoutine) {
      await api.updateRoutine(editingRoutine.id, routineData);
    } else {
      await api.createRoutine(routineData);
    }
    await Promise.all([
      loadRoutines(),
      loadDashboard(selectedDate),
    ]);
  };

  // Delete Routine
  const handleDeleteRoutine = async (id: string) => {
    await api.deleteRoutine(id);
    await Promise.all([
      loadRoutines(),
      loadDashboard(selectedDate),
    ]);
  };

  // Reorder Routines
  const handleReorderRoutines = async (ids: string[]) => {
    await api.reorderRoutines(ids);
    await Promise.all([
      loadRoutines(),
      loadDashboard(selectedDate),
    ]);
  };

  // Update Settings
  const handleUpdateSettings = async (partial: Partial<UserSettings>) => {
    const res = await api.updateSettings(partial);
    setSettings(res.settings);
    setStats(prev => ({ ...prev, daily_target_pct: res.settings.daily_target_pct }));
  };

  // Reset to Presets
  const handleResetPresets = async () => {
    await api.resetPresets();
    await Promise.all([
      loadRoutines(),
      loadDashboard(selectedDate),
      loadNotifications(),
    ]);
  };

  // Clear User Data
  const handleClearData = async () => {
    if (window.confirm('Clear all your routines and completions?')) {
      await api.clearData();
      await Promise.all([
        loadRoutines(),
        loadDashboard(selectedDate),
        loadNotifications(),
      ]);
    }
  };

  // Test Push
  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const res = await api.testPush();
      if (res.success) {
        if (soundEnabled) soundEngine.playTacticalChime();
        await loadNotifications();
      }
    } catch (err) {
      console.error('Test push error:', err);
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    await api.markNotificationRead(id);
    await loadNotifications();
  };

  const handleMarkAllNotifsRead = async () => {
    await api.markAllNotificationsRead();
    await loadNotifications();
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f1f5f9] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentStreak={stats.current_streak}
        userName={user.name}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Page Routing */}
      <main className="flex-1 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-neutral-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono tracking-widest uppercase text-emerald-400">
                INITIALIZING DISCIPLINE OS...
              </span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                stats={stats}
                timeline={timeline}
                userName={user.name}
                onSetStatus={handleSetStatus}
                onOpenAddModal={() => {
                  setEditingRoutine(null);
                  setIsAddModalOpen(true);
                }}
                onNavigateTab={setActiveTab}
                soundEnabled={soundEnabled}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  loadDashboard(date);
                }}
              />
            )}

            {activeTab === 'routines' && (
              <RoutinesPage
                routines={routines}
                onOpenAddModal={() => {
                  setEditingRoutine(null);
                  setIsAddModalOpen(true);
                }}
                onEditRoutine={(r) => {
                  setEditingRoutine(r);
                  setIsAddModalOpen(true);
                }}
                onDeleteRoutine={handleDeleteRoutine}
                onReorderRoutines={handleReorderRoutines}
                onResetPresets={handleResetPresets}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarPage
                onSetStatus={handleSetStatus}
                soundEnabled={soundEnabled}
                onNavigateDateToDashboard={(date) => {
                  setSelectedDate(date);
                  loadDashboard(date);
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsPage />
            )}

            {activeTab === 'streaks' && (
              <StreaksPage soundEnabled={soundEnabled} />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                user={user}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onResetPresets={handleResetPresets}
                onClearData={handleClearData}
              />
            )}
          </>
        )}
      </main>

      {/* Add / Edit Routine Modal */}
      <AddRoutineModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        initialData={editingRoutine}
      />

      {/* Slide-out Notifications Command Log */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onTestPush={handleTestPush}
        isTestingPush={isTestingPush}
      />

      {/* Account / Profile Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUserChanged={(newUser) => {
          setUser(newUser);
          loadAll();
        }}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

    </div>
  );
}
