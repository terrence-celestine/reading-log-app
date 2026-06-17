// src/components/TopBar.tsx
import { BookOpen, Bell } from 'lucide-react';

interface TopBarProps {
  title?: string;
  notificationCount?: number;
  onBellPress?: () => void;
}

const TopBar = ({ title, notificationCount = 0, onBellPress }: TopBarProps) => {
  const showBadge = notificationCount > 0;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#FDFCF9] border-b border-[#E8E5DE] md:hidden">
      {title ? (
        <span className="text-sm font-medium text-[#2C2C2A]">{title}</span>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2C2C2A] rounded-md flex items-center justify-center">
            <BookOpen size={13} color="#F7F5F0" />
          </div>
          <span className="text-sm font-medium text-[#2C2C2A]">ReadLog</span>
        </div>
      )}

      <button onClick={onBellPress} className="relative text-[#5F5E5A]">
        <Bell size={18} />
        {showBadge && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#2C2C2A] text-[#F7F5F0] text-[9px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    </header>
  );
};

export default TopBar;