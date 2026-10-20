import React from 'react';
import { X, Bell, Check, Clock, AlertTriangle, Sun, Moon, Sparkles, Send } from 'lucide-react';
import { NotificationRecord } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onTestPush: () => void;
  isTestingPush: boolean;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onTestPush,
  isTestingPush,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationRecord['type']) => {
    switch (type) {
      case 'morning_brief':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'evening_summary':
        return <Moon className="w-4 h-4 text-purple-400" />;
      case 'grace_warning':
      case 'repeat_reminder':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'milestone':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'task_due':
      default:
        return <Clock className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0a0c12] border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Discipline Command Log</h2>
              <p className="text-[11px] text-neutral-400">Real-time schedule alerts & reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800/80 flex items-center justify-between">
          <button
            onClick={onTestPush}
            disabled={isTestingPush}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700/80 text-[11px] font-semibold text-emerald-400 hover:bg-neutral-800 transition disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isTestingPush ? 'Sending...' : 'Test Real-time Ping'}</span>
          </button>

          {notifications.some(n => !n.read) && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-neutral-400 hover:text-white transition flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="text-xs font-semibold text-neutral-400">Log Clean</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
                Scheduled notifications, grace alerts, and briefings will appear here automatically.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  notif.read
                    ? 'bg-neutral-900/40 border-neutral-800/70 text-neutral-400'
                    : 'bg-neutral-900/90 border-emerald-500/30 text-white shadow-[0_0_10px_rgba(16,185,129,0.06)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-lg bg-neutral-950 border border-neutral-800">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold truncate text-white">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                      {notif.body}
                    </p>
                    <span className="text-[10px] font-mono text-neutral-500 mt-2 block">
                      {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-800 text-center bg-neutral-950/60 text-[11px] text-neutral-400">
          Reminders run on reliable backend scheduler even when app is minimized.
        </div>

      </div>
    </div>
  );
};
