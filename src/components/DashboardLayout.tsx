import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Home, Users, BarChart3, Settings, LogOut, Menu, X, Shield, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { ActivationBanner } from './ActivationBanner';
import { ThemeToggle } from './ThemeToggle';
import floodLogo from '../assets/flood-logo.png';

export const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Bots', href: '/dashboard/bots', icon: Bot },
    { name: 'Leads', href: '/dashboard/leads', icon: BarChart3 },
    { name: 'Usage', href: '/dashboard/usage', icon: TrendingUp },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Affiliate', href: '/dashboard/affiliate', icon: DollarSign },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-3 pt-2">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/75 dark:bg-gray-900/70 border border-white/50 dark:border-gray-700/70 shadow-lg shadow-primary/10 backdrop-blur-xl">
          <div className="flex items-center">
            <img src={floodLogo} alt="Flood.chat logo" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="ml-2 text-lg font-bold text-foreground">Flood.chat</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white/75 dark:bg-gray-900/70 border-r border-white/50 dark:border-gray-700/70 shadow-xl shadow-primary/10 backdrop-blur-xl z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/50 dark:border-gray-700/70">
            <div className="flex items-center gap-3">
              <img src={floodLogo} alt="Flood.chat logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <div>
                <span className="text-xl font-bold text-foreground">Flood.chat</span>
                <p className="text-xs text-muted-foreground">Workspace</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="ml-3 font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/50 dark:border-gray-700/70 bg-white/65 dark:bg-gray-900/60 backdrop-blur-md">
            <div className="flex items-center mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3 px-2">
              <ThemeToggle />
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center px-4 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72 pt-[5.5rem] lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <ActivationBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
};
