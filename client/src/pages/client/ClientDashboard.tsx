import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, Clock, AlertTriangle, CheckCircle, Users,
    Plus, ArrowRight, Bell, TrendingUp, Calendar,
    MessageSquare, Zap, Brain, Shield, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Badge, Button } from '../../components/common';
import { clientAPI } from '../../services/api';
import './ClientDashboard.css';

interface DashboardData {
    stats: {
        totalCases: number;
        activeCases: number;
        urgentCases: number;
        resolvedCases: number;
    };
    recentCases: any[];
    notifications: any[];
    unreadNotifications: number;
    hasUrgent: boolean;
    advocateWarning: any;
}

export function ClientDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setIsLoading(true);
            const response = await clientAPI.getDashboard();
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load dashboard');
            // Fallback to mock data for demo
            setData({
                stats: {
                    totalCases: 12,
                    activeCases: 4,
                    urgentCases: 1,
                    resolvedCases: 7
                },
                recentCases: [
                    {
                        _id: '1',
                        title: 'Property Dispute - Land Registration',
                        category: 'Property',
                        status: 'in_review',
                        urgencyLevel: 'high',
                        createdAt: '2024-01-15',
                        advocateId: { name: 'Adv. Priya Sharma' },
                        aiAnalysis: { aiMatchScore: 94 }
                    },
                    {
                        _id: '2',
                        title: 'Business Contract Breach',
                        category: 'Corporate',
                        status: 'assigned',
                        urgencyLevel: 'medium',
                        createdAt: '2024-01-12',
                        advocateId: { name: 'Adv. Rahul Mehta' },
                        aiAnalysis: { aiMatchScore: 87 }
                    },
                    {
                        _id: '3',
                        title: 'Family Settlement Agreement',
                        category: 'Family',
                        status: 'submitted',
                        urgencyLevel: 'low',
                        createdAt: '2024-01-10',
                        aiAnalysis: { aiMatchScore: 76 }
                    }
                ],
                notifications: [
                    {
                        _id: '1',
                        title: 'Case Update',
                        message: 'Your advocate has updated the status of your property case.',
                        type: 'case_update',
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        read: false
                    },
                    {
                        _id: '2',
                        title: 'Urgent Action Required',
                        message: 'Document submission deadline approaching for Case #1234.',
                        type: 'urgent',
                        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                        read: false
                    },
                    {
                        _id: '3',
                        title: 'Advocate Assigned',
                        message: 'Adv. Rahul Mehta has accepted your case.',
                        type: 'advocate_accepted',
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        read: true
                    }
                ],
                unreadNotifications: 2,
                hasUrgent: true,
                advocateWarning: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getUrgencyBadge = (level: string) => {
        const variants: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
            critical: 'danger',
            high: 'warning',
            medium: 'info',
            low: 'success'
        };
        return variants[level] || 'info';
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'success' | 'warning' | 'info' | 'primary'> = {
            'submitted': 'default',
            'pending_acceptance': 'info',
            'assigned': 'primary',
            'in_review': 'warning',
            'in_progress': 'warning',
            'completed': 'success',
            'closed': 'success'
        };
        return variants[status] || 'default';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getNotificationType = (type: string) => {
        if (type.includes('urgent') || type.includes('critical')) return 'urgent';
        if (type.includes('success') || type.includes('accepted') || type.includes('completed')) return 'success';
        if (type.includes('warning') || type.includes('deadline')) return 'warning';
        return 'info';
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={48} />
                <h2>Failed to load dashboard</h2>
                <p>{error}</p>
                <Button onClick={loadDashboard}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="client-dashboard">
            {/* Welcome Section */}
            <section className="dashboard-welcome">
                <div className="welcome-content">
                    <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
                    <p>Here's an overview of your legal matters</p>
                </div>
                <Link to="/dashboard/submit-case" className="submit-case-btn">
                    <Plus size={18} />
                    Submit New Case
                </Link>
            </section>

            {/* Advocate Warning */}
            {data.advocateWarning && (
                <GlassCard className="warning-banner">
                    <AlertTriangle size={20} />
                    <span>
                        Your advocate <strong>{data.advocateWarning.advocateName}</strong> has been inactive for{' '}
                        <strong>{data.advocateWarning.hoursSinceActive} hours</strong> on case "{data.advocateWarning.caseTitle}".
                    </span>
                </GlassCard>
            )}

            {/* Stats Grid */}
            <section className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon active">
                        <FileText size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.activeCases}</span>
                        <span className="stat-label">Active Cases</span>
                    </div>
                </GlassCard>

                <GlassCard className={`stat-card ${data.hasUrgent ? 'urgent' : ''}`}>
                    <div className="stat-icon urgent">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.urgentCases}</span>
                        <span className="stat-label">Urgent Cases</span>
                    </div>
                    {data.hasUrgent && <div className="stat-pulse" />}
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon pending">
                        <Clock size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.totalCases}</span>
                        <span className="stat-label">Total Cases</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon success">
                        <CheckCircle size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.resolvedCases}</span>
                        <span className="stat-label">Resolved</span>
                    </div>
                </GlassCard>
            </section>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Cases */}
                <GlassCard className="cases-card">
                    <div className="card-header">
                        <h2>
                            <FileText size={20} />
                            Recent Cases
                        </h2>
                        <Link to="/dashboard/cases" className="view-all">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="cases-list">
                        {data.recentCases.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} />
                                <p>No cases yet. Submit your first case to get started!</p>
                                <Link to="/dashboard/submit-case">
                                    <Button variant="primary">Submit Case</Button>
                                </Link>
                            </div>
                        ) : (
                            data.recentCases.map((caseItem) => (
                                <Link
                                    to={`/dashboard/cases/${caseItem._id}`}
                                    key={caseItem._id}
                                    className="case-item"
                                >
                                    <div className="case-main">
                                        <div className="case-header">
                                            <h3>{caseItem.title}</h3>
                                            <div className="case-badges">
                                                <Badge variant={getUrgencyBadge(caseItem.urgencyLevel)}>
                                                    {caseItem.urgencyLevel}
                                                </Badge>
                                                <Badge variant={getStatusBadge(caseItem.status)}>
                                                    {formatStatus(caseItem.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="case-meta">
                                            <span className="case-category">{caseItem.category}</span>
                                            <span className="case-date">
                                                {new Date(caseItem.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="case-footer">
                                        {caseItem.advocateId && (
                                            <div className="case-advocate">
                                                <div className="advocate-avatar">
                                                    {(caseItem.advocateId.name || 'A').split(' ').map((n: string) => n[0]).join('')}
                                                </div>
                                                <span>{caseItem.advocateId.name}</span>
                                            </div>
                                        )}
                                        {caseItem.aiAnalysis?.aiMatchScore && (
                                            <div className="ai-score">
                                                <Brain size={14} />
                                                <span>{caseItem.aiAnalysis.aiMatchScore}% Match</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Quick Actions & Notifications */}
                <div className="sidebar-cards">
                    {/* Quick Actions */}
                    <GlassCard className="actions-card">
                        <h2>
                            <Zap size={20} />
                            Quick Actions
                        </h2>
                        <div className="actions-grid">
                            <Link to="/dashboard/submit-case" className="action-btn primary">
                                <Plus size={20} />
                                <span>New Case</span>
                            </Link>
                            <Link to="/dashboard/chat" className="action-btn">
                                <MessageSquare size={20} />
                                <span>AI Chat</span>
                            </Link>
                            <Link to="/dashboard/advocates" className="action-btn">
                                <Users size={20} />
                                <span>Find Advocate</span>
                            </Link>
                            <Link to="/dashboard/documents" className="action-btn">
                                <Shield size={20} />
                                <span>Documents</span>
                            </Link>
                        </div>
                    </GlassCard>

                    {/* Notifications */}
                    <GlassCard className="notifications-card">
                        <div className="card-header">
                            <h2>
                                <Bell size={20} />
                                Notifications
                            </h2>
                            {data.unreadNotifications > 0 && (
                                <span className="notification-count">
                                    {data.unreadNotifications}
                                </span>
                            )}
                        </div>

                        <div className="notifications-list">
                            {data.notifications.length === 0 ? (
                                <p className="empty-notifications">No notifications yet</p>
                            ) : (
                                data.notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${getNotificationType(notification.type)} ${notification.read ? 'read' : ''}`}
                                    >
                                        <div className="notification-icon">
                                            {getNotificationType(notification.type) === 'urgent' && <AlertTriangle size={16} />}
                                            {getNotificationType(notification.type) === 'success' && <CheckCircle size={16} />}
                                            {getNotificationType(notification.type) === 'info' && <Bell size={16} />}
                                            {getNotificationType(notification.type) === 'warning' && <Clock size={16} />}
                                        </div>
                                        <div className="notification-content">
                                            <span className="notification-title">{notification.title}</span>
                                            <span className="notification-message">{notification.message}</span>
                                            <span className="notification-time">{formatTime(notification.createdAt)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <Link to="/dashboard/notifications" className="view-all-notifications">
                            View All Notifications
                            <ArrowRight size={16} />
                        </Link>
                    </GlassCard>
                </div>
            </div>

            {/* AI Assistant Prompt */}
            <GlassCard variant="liquid" className="ai-prompt-card">
                <div className="ai-prompt-content">
                    <div className="ai-icon">
                        <Brain size={28} />
                    </div>
                    <div className="ai-text">
                        <h3>Need Legal Guidance?</h3>
                        <p>Our AI assistant can help you understand your legal options, draft documents, and prepare for your case.</p>
                    </div>
                </div>
                <Link to="/dashboard/chat" className="ai-prompt-btn">
                    Start AI Chat
                    <ArrowRight size={18} />
                </Link>
            </GlassCard>
        </div>
    );
}
