
import React from 'react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShoppingCart, Package, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationList: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle className="h-4 w-4" />;
      case 'new_product':
        return <ShoppingCart className="h-4 w-4" />;
      case 'order_update':
        return <Check className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return 'bg-blue-100 text-blue-500';
      case 'new_product':
        return 'bg-green-100 text-green-500';
      case 'order_update':
        return 'bg-amber-100 text-amber-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.type === 'order_update' && notification.title.includes('Offer Accepted')) {
      // Open chat with the specific conversation
      // For now, we'll just redirect to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col">
      {notifications.length > 0 ? (
        <>
          <div className="p-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-gray-500">
              Mark all as read
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 cursor-pointer hover:bg-gray-50 ${!notification.is_read ? 'bg-gray-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-full mr-3 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
