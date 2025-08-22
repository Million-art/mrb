import { useNavigate } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { telegramId } from "@/libs/telegram";
import axios from "axios";
import { API_CONFIG } from "@/config/api";

const HeaderSetting = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/api/v1/notifications/${telegramId}/unread-count`);
        if (response.data?.success) {
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex items-center justify-between space-x-4 p-5">
      <button
        className="text-gray-400 transition-colors duration-200 hover:text-white relative"
        aria-label="Notifications"
        onClick={() => navigate("/notifications")}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <button
        className="text-gray-400 transition-colors duration-200 hover:text-white"
        aria-label="Settings"
        onClick={() => navigate("/settings")}
      >
        <Settings className="w-6 h-6" />
      </button>
    </section>
  );
};

export default HeaderSetting;
