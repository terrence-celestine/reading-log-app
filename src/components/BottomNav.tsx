import { BookOpen, BarChart2, Plus, Users, MoreHorizontal } from 'lucide-react';
import type { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onFabPress: () => void;
  onMorePress: () => void;
}

const BottomNav = ({ activeTab, onTabChange, onFabPress, onMorePress }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-end bg-[#FDFCF9] border-t border-[#E8E5DE] pb-safe md:hidden">
      <NavItem icon={<BookOpen size={20} />} label="Library" active={activeTab === 'library'} onClick={() => onTabChange('library')} />
      <NavItem icon={<Users size={20} />} label="Friends" active={activeTab === 'friends'} onClick={() => onTabChange('friends')} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={onFabPress}
          className="w-12 h-12 bg-[#2C2C2A] rounded-full flex items-center justify-center shadow-lg -translate-y-3"
        >
          <Plus size={22} color="#F7F5F0" />
        </button>
      </div>
      <NavItem icon={<BarChart2 size={20} />} label="Stats" active={activeTab === 'stats'} onClick={() => onTabChange('stats')} />
      <NavItem icon={<MoreHorizontal size={20} />} label="More" active={false} onClick={onMorePress} />
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