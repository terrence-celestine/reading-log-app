// src/components/AppLayout.tsx
import { useState } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import SyncStatus from './SyncStatus';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookSheet from '../screens/AddBookSheet';
import { useAddBook } from '@/hooks/useAddBook';
import { BookOpen, BarChart2, Users, User, Plus, Sparkles, NotebookPen, Bell } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { useAuth } from '../context/AuthContext';
import FriendsScreen from '@/screens/FriendsScreen';
import RecsScreen from '@/screens/RecsScreens';
import NotesScreen from '@/screens/NotesScreen';
import MoreSheet from './MoreSheet';
import type { NavTab } from '../types';
import NotificationsScreen from '@/screens/NotificationScreen';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import StatsScreen from '@/screens/StatsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import { Compass } from 'lucide-react';

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('library');

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [addBookSheetOpen, setAddBookSheetOpen] = useState(false);      
  const handleBookSelect = (id: string) => setSelectedBookId(id);
  const handleBack = () => setSelectedBookId(null);
  const { addBook } = useAddBook();
  const { user, logout } = useAuth();
  const notificationCount = useNotificationCount();
  // add state
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const renderScreen = () => {
    if (selectedBookId) {
      return <BookDetailScreen bookId={selectedBookId} onBack={handleBack} />;
    }
    switch (activeTab) {
      case 'library': return <LibraryScreen onBookSelect={handleBookSelect} />;
      case 'friends': return <FriendsScreen />;
      case 'recs': return <RecsScreen />;
      case 'notes': return <NotesScreen />;
      case 'notifications': return <NotificationsScreen />;
      case 'stats': return <StatsScreen />;
      case 'explore': return <ExploreScreen />;
      default: return <HomeScreen onBookSelect={handleBookSelect} />;
    }
  };

  // src/components/AppLayout.tsx
return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col md:flex-row">
  
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-52 min-h-screen bg-[#FDFCF9] border-r border-[#E8E5DE] fixed top-0 left-0">
        
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-[#E8E5DE]">
          <div className="w-6 h-6 bg-[#2C2C2A] rounded-md flex items-center justify-center">
            <BookOpen size={13} color="#F7F5F0" />
          </div>
          <span className="text-sm font-medium text-[#2C2C2A]">ReadLog</span>
        </div>
  
        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <p className="text-[10px] font-medium text-[#B4B2A9] uppercase tracking-wider px-2 mb-1 mt-2">Library</p>
          <SidebarItem
            icon={<Compass size={16} />}
            label="Explore"
            active={activeTab === 'explore'}
            onClick={() => { setSelectedBookId(null); setActiveTab('explore'); }}
          />
          <SidebarItem icon={<BookOpen size={16} />} label="My books" active={activeTab === 'library' && !selectedBookId} onClick={() => { setSelectedBookId(null); setActiveTab('library'); }} />
          <SidebarItem icon={<BarChart2 size={16} />} label="Stats" active={activeTab === 'stats'} onClick={() => { setSelectedBookId(null); setActiveTab('stats'); }} />
          
          <p className="text-[10px] font-medium text-[#B4B2A9] uppercase tracking-wider px-2 mb-1 mt-4">Social</p>
          <SidebarItem icon={<Users size={16} />} label="Friends" active={activeTab === 'friends'} onClick={() => { setSelectedBookId(null); setActiveTab('friends'); }} />
          <SidebarItem icon={<User size={16} />} label="Profile" active={activeTab === 'profile'} onClick={() => { setSelectedBookId(null); setActiveTab('profile'); }} />
          <SidebarItem 
            icon={<Sparkles size={16} />} 
            label="Recommendations" 
            active={activeTab === 'recs'} 
            onClick={() => { setSelectedBookId(null); setActiveTab('recs'); }} 
            />
          <SidebarItem
            icon={<NotebookPen size={16} />}
            label="My notes"
            active={activeTab === 'notes'}
            onClick={() => { setSelectedBookId(null); setActiveTab('notes'); }}
          />
          <SidebarItem
            icon={<Bell size={16} />}
            label="Notifications"
            active={activeTab === 'notifications'}
            onClick={() => { setSelectedBookId(null); setActiveTab('notifications'); }}
            badge={notificationCount}
          />
        </nav>
  
        {/* Sidebar bottom — add book + user + logout */}
        <div className="p-3 border-t border-[#E8E5DE] flex flex-col gap-2">
        <button
            onClick={() => setAddBookSheetOpen(true)}
            className="w-full bg-[#2C2C2A] text-[#F7F5F0] text-[12px] font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:cursor-pointer"
        >
            <Plus size={14} />
            Add book
        </button>
        <div className="flex items-center justify-between px-1 pt-1">
            <div>
            <p className="text-[12px] font-medium text-[#2C2C2A]">{user?.username}</p>
            <p className="text-[10px] text-[#B4B2A9]">{user?.email}</p>
            </div>
            <button
            onClick={logout}
            className="text-[11px] text-[#888780] hover:text-[#2C2C2A] transition-colors hover:cursor-pointer"
            >
            Sign out
            </button>
        </div>
        </div>
      </aside>
  
      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col md:ml-52">
        <SyncStatus />
        <TopBar notificationCount={notificationCount} onBellPress={() => setMoreSheetOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6 max-w-screen-sm mx-auto w-full">
          {renderScreen()}
        </main>
      </div>
  
      {/* Mobile only */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => { setSelectedBookId(null); setActiveTab(tab); }}
        onFabPress={() => setAddBookSheetOpen(true)}
        onMorePress={() => setMoreSheetOpen(true)}
      />
  
      <AddBookSheet
        open={addBookSheetOpen}
        onClose={() => setAddBookSheetOpen(false)}
        onAdd={(title, author, status) => {
          addBook(title, author, status);
          setAddBookSheetOpen(false);
        }}
      />
      <MoreSheet
        open={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        onNavigate={(tab) => { setSelectedBookId(null); setActiveTab(tab); }}
      />
    </div>
  );
};

export default AppLayout;