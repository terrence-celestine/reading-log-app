// src/components/BottomNav.tsx
import { Plus, Users, User, BookOpen, BarChart2} from 'lucide-react';

type NavTab = 'library' | 'stats' | 'friends' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onFabPress: () => void;
}

const BottomNav = ({ activeTab, onTabChange, onFabPress }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-end bg-[#FDFCF9] border-t border-[#E8E5DE] pb-safe md:hidden">
      
      <NavItem icon={<BookOpen size={20} />} label="Library" active={activeTab === 'library'} onClick={() => onTabChange('library')} />
      <NavItem icon={<BarChart2 size={20} />} label="Stats" active={activeTab === 'stats'} onClick={() => onTabChange('stats')} />

      {/* FAB */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={onFabPress}
          className="w-12 h-12 bg-[#2C2C2A] rounded-full flex items-center justify-center shadow-lg -translate-y-3"
        >
          <Plus size={22} color="#F7F5F0" />
        </button>
      </div>

      <NavItem icon={<Users size={20} />} label="Friends" active={activeTab === 'friends'} onClick={() => onTabChange('friends')} />
      <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />

    </nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-1 text-[9px] font-medium transition-colors
      ${active ? 'text-[#2C2C2A]' : 'text-[#B4B2A9]'}`}
  >
    {icon}
    {label}
  </button>
);

export default BottomNav;