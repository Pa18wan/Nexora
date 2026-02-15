import { useState, useEffect } from 'react';
import {
    Bell, CheckCircle, Clock, Trash2, Check,
    AlertTriangle, Info, Briefcase, MessageSquare
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { notificationsAPI } from '../../services/api';
import './Notifications.css';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const response = await notificationsAPI.getAll();
            if (response.data.success) {
                setNotifications(response.data.data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await notificationsAPI.markAsRead(id);
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await notificationsAPI.markAllAsRead();
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'case_update': return <Briefcase className="icon-blue" size={20} />;
            case 'ai_analysis': return <CheckCircle className="icon-purple" size={20} />;
            case 'new_message': return <MessageSquare className="icon-cyan" size={20} />;
            case 'alert': return <AlertTriangle className="icon-warning" size={20} />;
            default: return <Info className="icon-primary" size={20} />;
        }
    };

    const filteredNotifications = activeFilter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <div className="notifications-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h1>Notifications</h1>
                        <p>Stay updated with your latest activities</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={!notifications.some(n => !n.isRead)}
                    >
                        <Check size={16} />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="filter-tabs">
                <button
                    className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    All Notifications
                    <Badge variant="secondary" className="tab-count">{notifications.length}</Badge>
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('unread')}
                >
                    Unread
                    <Badge variant="danger" className="tab-count">
                        {notifications.filter(n => !n.isRead).length}
                    </Badge>
                </button>
            </div>

            {isLoading ? (
                <div className="loading-state">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <Bell size={48} className="empty-icon" />
                    <h3>No notifications found</h3>
                    <p>When you have new updates, they'll appear here.</p>
                </GlassCard>
            ) : (
                <div className="notifications-list">
                    {filteredNotifications.map((notification) => (
                        <GlassCard
                            key={notification._id}
                            variant="liquid"
                            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                        >
                            <div className="notification-icon">
                                {getIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-top">
                                    <h3>{notification.title}</h3>
                                    <span className="notification-time">
                                        <Clock size={12} />
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p>{notification.message}</p>
                            </div>
                            {!notification.isRead && (
                                <div className="unread-dot" />
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
