import { useEffect } from "react";
import { syncManager } from "../lib/syncManager";

export const useSyncWorker = () => {
    useEffect(() => {
        // Run immediately on mount
        syncManager.processQueue();
        // Run every 5 seconds
        const interval = setInterval(() => {
          syncManager.processQueue();
        }, 5000);
        return () => clearInterval(interval);
      }, []);
}