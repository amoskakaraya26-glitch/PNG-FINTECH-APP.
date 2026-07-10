import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatting';

interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'compliance' | 'account' | 'promotion';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: string;
  readAt?: string;
}

interface NotificationsCenterProps {
  userId?: string;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();

      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n: any) => n.status !== 'read').length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(
        notifications.map((n) => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      transaction: '💱',
      security: '🔒',
      compliance: '📋',
      account: '👤',
      promotion: '🎉',
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      transaction: 'border-l-4 border-blue-500 bg-blue-50',
      security: 'border-l-4 border-red-500 bg-red-50',
      compliance: 'border-l-4 border-yellow-500 bg-yellow-50',
      account: 'border-l-4 border-green-500 bg-green-50',
      promotion: 'border-l-4 border-purple-500 bg-purple-50',
    };
    return colors[type] || 'bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold">{unreadCount}</span> unread notifications
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-6 rounded">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No notifications yet</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition ${getNotificationColor(
                notification.type
              )} ${notification.status !== 'read' ? 'font-semibold' : ''}`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(new Date(notification.createdAt))}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Status */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs">
                      {notification.status === 'read' && (
                        <span className="text-gray-500">✓ Read</span>
                      )}
                      {notification.status === 'pending' && (
                        <span className="text-yellow-600">⏳ Pending</span>
                      )}
                      {notification.status === 'failed' && (
                        <span className="text-red-600">✗ Failed</span>
                      )}
                    </span>

                    {notification.status !== 'read' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-center">
        <button
          onClick={fetchNotifications}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default NotificationsCenter;
