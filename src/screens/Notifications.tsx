import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { telegramId } from "@/libs/telegram";
import axios from "axios";
import { API_CONFIG } from "@/config/api";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { Button } from "@/components/stonfi/ui/button";
import { Card, CardContent } from "@/components/stonfi/ui/card";

interface Notification {
  id: string;
  userId: string;
  type: 'QUOTE_COMPLETED' | 'QUOTE_FAILED' | 'QUOTE_EXPIRED' | 'REFUND_FAILED';
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/notifications/${telegramId}`);
      if (response.data?.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch(setShowMessage({
        message: t('notifications.failedToFetch'),
        color: "red"
      }));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      await axios.post(`${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      dispatch(setShowMessage({
        message: t('notifications.failedToMarkAsRead'),
        color: "red"
      }));
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/notifications/${telegramId}/read-all`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        }))
      );

      dispatch(setShowMessage({
        message: t('notifications.allMarkedAsRead'),
        color: "green"
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      dispatch(setShowMessage({
        message: t('notifications.failedToMarkAllAsRead'),
        color: "red"
      }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes === 0 ? t('notifications.justNow') : t('notifications.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return t('notifications.hoursAgo', { hours });
    } else {
      const days = Math.floor(diffInHours / 24);
      return t('notifications.daysAgo', { days });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
              aria-label={t('notifications.title')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-semibold">{t('notifications.title')}</h1>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="text-sm bg-gray-800/50 border-gray-700 hover:bg-gray-700"
            >
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4 mb-[100px]">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-semibold mb-2">{t('notifications.noNotifications')}</h3>
                  <p className="text-gray-400">{t('notifications.noNotificationsDesc')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-colors ${
                  notification.read 
                    ? 'bg-gray-800/30 border-gray-700' 
                    : 'bg-blue-900/20 border-blue-700/50'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                          notification.read ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mb-2 ${
                          notification.read ? 'text-gray-400' : 'text-gray-300'
                        }`}>
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        disabled={markingAsRead === notification.id}
                        className="ml-2 text-gray-400 hover:text-green-400 disabled:opacity-50"
                        title={t('notifications.markAsRead')}
                      >
                        {markingAsRead === notification.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications; 