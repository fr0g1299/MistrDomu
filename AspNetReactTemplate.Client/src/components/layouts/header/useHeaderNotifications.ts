import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { apiService } from "@/lib/apiService";
import type { NotificationListItem } from "@/types/notification";

const INBOX_PAGE_SIZE = 5;

type UseHeaderNotificationsArgs = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onNavigateTo: (path: string) => void;
};

function getNotificationTargetPath(item: NotificationListItem): string | null {
  if (item.type === "role_request_admin") {
    return "/admin/expert-role-requests";
  }

  if (item.type === "role_request") {
    return "/my-requests";
  }

  return null;
}

export function useHeaderNotifications({
  isAuthenticated,
  isAdmin,
  onNavigateTo,
}: UseHeaderNotificationsArgs) {
  const [pendingExpertRequestCount, setPendingExpertRequestCount] = useState(0);
  const [inboxItems, setInboxItems] = useState<NotificationListItem[]>([]);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  const refreshHeaderNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setInboxItems([]);
      setInboxUnreadCount(0);
      setPendingExpertRequestCount(0);
      return;
    }

    try {
      const notifications = await apiService.getMyNotifications({
        page: 1,
        pageSize: INBOX_PAGE_SIZE,
      });
      setInboxItems(notifications.items);
      setInboxUnreadCount(notifications.unreadCount);
    } catch {
      // Do not break header rendering when notifications fail.
    }

    if (isAdmin) {
      try {
        const count = await apiService.getPendingExpertRoleRequestsCount();
        setPendingExpertRequestCount(count);
      } catch {
        setPendingExpertRequestCount(0);
      }
    } else {
      setPendingExpertRequestCount(0);
    }
  }, [isAdmin, isAuthenticated]);

  const deleteAllInboxItems = useCallback(() => {
    if (inboxItems.length === 0) {
      return;
    }

    const previousItems = inboxItems;
    const previousUnreadCount = inboxUnreadCount;

    setInboxItems([]);
    setInboxUnreadCount(0);

    void apiService.deleteAllNotifications().catch((error) => {
      setInboxItems(previousItems);
      setInboxUnreadCount(previousUnreadCount);
      toast.error(
        error instanceof Error
          ? error.message
          : "Smazání všech notifikací se nezdařilo.",
      );
      void refreshHeaderNotifications();
    });
  }, [inboxItems, inboxUnreadCount, refreshHeaderNotifications]);

  const deleteInboxItem = useCallback(
    (id: number) => {
      const previousItems = inboxItems;
      const previousUnreadCount = inboxUnreadCount;
      const target = previousItems.find((item) => item.id === id);

      if (!target) {
        return;
      }

      setInboxItems((current) => current.filter((item) => item.id !== id));
      if (!target.isRead) {
        setInboxUnreadCount((prev) => Math.max(0, prev - 1));
      }

      void apiService
        .deleteNotification(id)
        .then(() => {
          // Re-sync unread counter and first-page items with backend truth.
          void refreshHeaderNotifications();
        })
        .catch((error) => {
          setInboxItems(previousItems);
          setInboxUnreadCount(previousUnreadCount);
          toast.error(
            error instanceof Error
              ? error.message
              : "Smazání zprávy se nezdařilo.",
          );
        });
    },
    [inboxItems, inboxUnreadCount, refreshHeaderNotifications],
  );

  const openInboxItem = useCallback(
    (item: NotificationListItem) => {
      if (!item.isRead) {
        setInboxItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, isRead: true }
              : currentItem,
          ),
        );
        setInboxUnreadCount((prev) => Math.max(0, prev - 1));

        void apiService.markNotificationAsRead(item.id).catch(() => {
          void refreshHeaderNotifications();
        });
      }

      const targetPath = getNotificationTargetPath(item);
      if (targetPath) {
        onNavigateTo(targetPath);
        setIsInboxOpen(false);
      }
    },
    [onNavigateTo, refreshHeaderNotifications],
  );

  useEffect(() => {
    void refreshHeaderNotifications();
  }, [refreshHeaderNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshHeaderNotifications();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshHeaderNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleHeaderRefresh = () => {
      void refreshHeaderNotifications();
    };

    window.addEventListener("header:refresh", handleHeaderRefresh);

    return () => {
      window.removeEventListener("header:refresh", handleHeaderRefresh);
    };
  }, [isAuthenticated, refreshHeaderNotifications]);

  return {
    pendingExpertRequestCount,
    inboxItems,
    inboxUnreadCount,
    isInboxOpen,
    setIsInboxOpen,
    deleteAllInboxItems,
    deleteInboxItem,
    openInboxItem,
  };
}
