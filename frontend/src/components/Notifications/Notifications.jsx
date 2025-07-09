import React, { useState, useEffect } from "react";
import { FaBell, FaCheckCircle, FaTrash } from "react-icons/fa";
import styles from "./Notifications.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from '../../utils/api';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (currentUser?.studentRef) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch(
        `http://localhost:5000/api/notifications/student/${currentUser.studentRef}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiFetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
      });
      // Refresh notifications after marking one as read
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the read action
    
    // Add confirmation dialog
    const confirmed = window.confirm("Are you sure you want to delete this notification?");
    if (!confirmed) return;
    
    try {
      const response = await apiFetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Remove the notification from local state
        setNotifications(prev => prev.filter(notification => notification._id !== id));
      } else {
        console.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    // Add confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${notifications.length} notification(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Delete all notifications one by one
      const deletePromises = notifications.map(notification =>
        apiFetch(`http://localhost:5000/api/notifications/${notification._id}`, {
          method: "DELETE",
        })
      );
      
      await Promise.all(deletePromises);
      setNotifications([]); // Clear all notifications from state
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  return (
    <div className={styles.notificationsWrapper}>
      <button onClick={handleToggle} className={styles.bellButton}>
        <FaBell />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button
                className={styles.deleteAllButton}
                onClick={handleDeleteAllNotifications}
                title="Delete all notifications"
              >
                <FaTrash />
              </button>
            )}
          </div>
          <div className={styles.dropdownList}>
            {notifications.length === 0 ? (
              <div className={styles.noNotifications}>
                You have no new notifications.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${
                    notification.isRead ? styles.read : ""
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  <div className={styles.notificationContent}>
                    <FaCheckCircle className={styles.icon} />
                    <div className={styles.notificationText}>
                      <p>{notification.message}</p>
                      <small>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      title="Delete notification"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 