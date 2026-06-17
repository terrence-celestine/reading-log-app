// src/components/TopBar.tsx
import { BookOpen, Bell } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

const TopBar = ({ title }: TopBarProps) => {
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
      <div className="flex items-center gap-3 text-[#5F5E5A]">
        <Bell size={18} />
      </div>
    </header>
  );
};

export default TopBar;