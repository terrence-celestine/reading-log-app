// src/components/MoreSheet.tsx
import { X, User, Sparkles, NotebookPen, Bell, Compass } from 'lucide-react';
import type { NavTab } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  notificationCount?: number;
}

const ITEMS: { icon: React.ReactNode; label: string; tab: NavTab }[] = [
  { icon: <NotebookPen size={18} />, label: 'My notes', tab: 'notes' },
  { icon: <Sparkles size={18} />, label: 'Recommendations', tab: 'recs' },
  { icon: <User size={18} />, label: 'Profile', tab: 'profile' },
  { icon: <Bell size={18} />, label: 'Notifications', tab: 'notifications' },
  { icon: <Compass size={18} />, label: 'Explore', tab: 'explore' as NavTab }
];

const MoreSheet = ({ open, onClose, onNavigate, notificationCount = 0 }: Props) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FDFCF9] rounded-t-2xl md:hidden">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-[#D3D1C7] rounded-full" />
        </div>

        <div className="px-4 pb-8 pt-2 flex flex-col gap-1">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-medium text-[#2C2C2A]">More</h2>
            <button onClick={onClose} className="text-[#B4B2A9]">
              <X size={18} />
            </button>
          </div>

          {ITEMS.map(item => {
            const showBadge = item.tab === 'notifications' && (notificationCount ?? 0) > 0;
            return (
            <button
              key={item.tab}
              onClick={() => { onNavigate(item.tab); onClose(); }}
              className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[14px] text-[#2C2C2A] hover:bg-[#F0EDE6] transition-colors w-full text-left"
            >
              <span className="text-[#888780]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="bg-[#2C2C2A] text-[#F7F5F0] text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {notificationCount}
                </span>
              )}
            </button>)}
          )}
        </div>
      </div>
    </>
  );
};

export default MoreSheet;