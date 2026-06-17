// src/screens/NotificationsScreen.tsx
import { useState, useEffect } from 'react';
import { Bell, UserPlus, UserCheck, BookOpen } from 'lucide-react';

type NotificationType = 'friend_request' | 'friend_accepted' | 'recommendation';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  meta: {
    friendshipId?: string;
    username?: string;
    bookTitle?: string;
  };
}

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  friend_request: <UserPlus size={16} className="text-[#185FA5]" />,
  friend_accepted: <UserCheck size={16} className="text-[#3B6D11]" />,
  recommendation: <BookOpen size={16} className="text-[#534AB7]" />,
};

const BG_MAP: Record<NotificationType, string> = {
  friend_request: 'bg-[#E6F1FB]',
  friend_accepted: 'bg-[#EAF3DE]',
  recommendation: 'bg-[#EEEDFE]',
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications/list')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setNotifications(data);
        // Mark as seen
        localStorage.setItem('lastCheckedNotifications', new Date().toISOString());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[15px] font-medium text-[#2C2C2A]">Notifications</h1>
        <span className="text-[11px] text-[#888780]">{notifications.length} total</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#E8E5DE] rounded-2xl">
          <Bell size={24} className="text-[#B4B2A9] mx-auto mb-3" />
          <p className="text-sm text-[#888780]">No notifications yet</p>
          <p className="text-xs text-[#B4B2A9] mt-1">Friend requests and recommendations will appear here</p>
        </div>
      )}

      {/* Notifications list */}
      <div className="flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className="bg-[#FDFCF9] border border-[#E8E5DE] rounded-2xl p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${BG_MAP[n.type]}`}>
              {ICON_MAP[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#2C2C2A] leading-snug">{n.message}</p>
              <p className="text-[10px] text-[#B4B2A9] mt-1">
                {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default NotificationsScreen;