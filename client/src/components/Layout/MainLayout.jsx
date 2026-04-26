import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, User, Settings as SettingsIcon, LogOut, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { Bookmark, ClipboardList, ScanLine, AlertCircle } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, isActive }) => (
  <Link to={path}>
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
      isActive 
        ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
        : 'text-textSubtle hover:bg-white/5 hover:text-white'
    }`}>
      <Icon size={20} className={isActive ? 'text-primary' : 'text-textSubtle'} />
      <span className="font-medium truncate">{label}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-active" 
          className="absolute left-0 w-1 rounded-r-full bg-primary h-8"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </div>
  </Link>
);

const MainLayout = ({ role, userName }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = role === 'admin' ? [
    { icon: Home, label: 'Analytics Dashboard', path: '/admin/dashboard' },
    { icon: Library, label: 'Inventory Panel', path: '/admin/inventory' },
    { icon: ClipboardList, label: 'Issue Management', path: '/admin/issues' },
    { icon: LogOut, label: 'Fine Approvals', path: '/admin/fines' },
    { icon: User, label: 'General Requests', path: '/admin/requests' },
    { icon: SettingsIcon, label: 'Platform Settings', path: '/settings' },
  ] : [
    { icon: Home, label: 'Student Dashboard', path: '/dashboard' },
    { icon: ScanLine, label: 'Hardware Gun Scan', path: '/gun-station' },
    { icon: Library, label: 'Book Catalog', path: '/catalog' },
    { icon: User, label: 'My Profile', path: '/profile' },
    { icon: AlertCircle, label: 'Fine Requests', path: '/fine-requests' },
    { icon: Bookmark, label: 'Reservations', path: '/reservations' },
    { icon: SettingsIcon, label: 'Platform Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Glassmorphism style */}
      <div className="w-64 flex-shrink-0 glass-panel border-r border-white/5 relative z-20 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center space-x-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            ShelfSense
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.path}
              icon={item.icon} 
              label={item.label} 
              path={item.path} 
              isActive={location.pathname.startsWith(item.path)} 
            />
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-8 z-20">
          <div className="flex items-center">
            {/* Mobile menu button could go here */}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userName || 'Guest User'}</p>
              <p className="text-xs text-textSubtle capitalize">{role || 'Student'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center">
              <User size={18} className="text-gray-300" />
            </div>
          </div>
        </header>

        {/* Page Content with Framer Motion Page Transition */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
          
          {/* Decorative background blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
