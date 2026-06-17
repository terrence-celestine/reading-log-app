// src/hooks/useNotificationCount.ts
import { useState, useEffect } from 'react';

export const useNotificationCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/list');
        if (!res.ok) return;
        const data = await res.json();

        const lastChecked = localStorage.getItem('lastCheckedNotifications');
        if (!lastChecked) {
          setCount(data.length);
          return;
        }

        const unread = data.filter(
          (n: { createdAt: string }) => new Date(n.createdAt) > new Date(lastChecked)
        );
        setCount(unread.length);
      } catch {
        setCount(0);
      }
    };

    fetchCount();
  }, []);

  return count;
};