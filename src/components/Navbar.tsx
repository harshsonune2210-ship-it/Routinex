import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Bell, 
  Volume2, 
  VolumeX, 
  Calendar, 
  LayoutDashboard, 
  ListCheck, 
  BarChart3, 
  Trophy, 
  Settings as SettingsIcon,
  User,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { soundEngine } from '../utils/audio';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentStreak: number;
  userName: string;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  soundEnabled,
  onToggleSound,
  currentStreak,
  userName,
  onOpenAuth,
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routines', label: 'My Routines', icon: ListCheck },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'streaks', label: 'Streak History', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleTabClick = (id: string) => {
    if (soundEnabled) soundEngine.playTacticalChime();
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tactical Clock */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="relative w-9 h-9 rounded-xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:border-emerald-400 transition">
                <span className="text-emerald-400 font-black text-sm tracking-tighter">OS</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-wider text-white">DISCIPLINE</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">OS</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-400 hidden sm:block">
                  PUNCTUALITY & STREAK SYSTEM
                </div>
              </div>
            </button>

            {/* Tactical Live Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-neutral-950/80 border border-neutral-800/80 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-semibold text-emerald-400 tracking-wider">
                {currentTime}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Overall Streak Pill */}
            <button
              onClick={() => handleTabClick('streaks')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition text-xs font-bold"
              title="Current Daily Streak"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{currentStreak}d</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-lg border text-xs transition ${
                soundEnabled
                  ? 'bg-neutral-900 border-neutral-700 text-emerald-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}
              title={soundEnabled ? 'Tactical Audio Active' : 'Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile Pill */}
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition text-xs"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-neutral-200 font-medium max-w-[90px] truncate">{userName}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-neutral-800/80 bg-[#090a0f] space-y-1">
            <div className="px-3 py-2 text-xs font-mono text-emerald-400 bg-neutral-950/80 rounded-lg flex items-center justify-between mb-2">
              <span>ACTIVE COMMANDER:</span>
              <span className="font-bold text-white">{userName}</span>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between px-2">
              <span className="text-xs text-neutral-400">Tactical Time: {currentTime}</span>
              <button
                onClick={onOpenAuth}
                className="text-xs text-emerald-400 hover:underline"
              >
                Switch Account
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
