import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Briefcase, Shield, AlertTriangle, TrendingUp,
    CheckCircle, XCircle, Clock, Brain, Settings,
    Activity, FileText, ChevronRight, Eye, UserCheck,
    BarChart3, ArrowUpRight
} from 'lucide-react';
import { Button, GlassCard, Badge } from '../../components/common';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

interface DashboardData {
    stats: {
        totalUsers: number;
        activeAdvocates: number;
        totalCases: number;
        urgentCases: number;
        pendingVerifications: number;
    };
    recentActivity: any[];
    aiStats: any[];
}

export function AdminDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingAdvocates, setPendingAdvocates] = useState<any[]>([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setIsLoading(true);
            const [dashboardRes, pendingRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getPendingAdvocates()
            ]);

            if (dashboardRes.data.success) {
                setData(dashboardRes.data.data);
            }
            if (pendingRes.data.success) {
                setPendingAdvocates(pendingRes.data.data.advocates || []);
            }
        } catch (err: any) {
            console.error('Dashboard error:', err);
            // Fallback mock data
            setData({
                stats: {
                    totalUsers: 1250,
                    activeAdvocates: 85,
                    totalCases: 3420,
                    urgentCases: 23,
                    pendingVerifications: 8
                },
                recentActivity: [
                    { _id: '1', userId: { name: 'John Doe' }, action: 'case_create', createdAt: new Date().toISOString() },
                    { _id: '2', userId: { name: 'Jane Smith' }, action: 'advocate_hire', createdAt: new Date().toISOString() },
                    { _id: '3', userId: { name: 'Admin' }, action: 'advocate_approve', createdAt: new Date().toISOString() }
                ],
                aiStats: [
                    { _id: 'classification', count: 450, avgTokens: 120 },
                    { _id: 'urgency', count: 450, avgTokens: 80 },
                    { _id: 'matching', count: 320, avgTokens: 200 },
                    { _id: 'chat', count: 1200, avgTokens: 150 }
                ]
            });
            setPendingAdvocates([
                {
                    _id: 'a1',
                    userId: { name: 'Advocate Kumar', email: 'kumar@email.com', createdAt: new Date().toISOString() },
                    barCouncilId: 'BAR12345',
                    specialization: ['Criminal Law', 'Family Law'],
                    experienceYears: 8
                },
                {
                    _id: 'a2',
                    userId: { name: 'Advocate Singh', email: 'singh@email.com', createdAt: new Date().toISOString() },
                    barCouncilId: 'BAR67890',
                    specialization: ['Corporate Law'],
                    experienceYears: 12
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAdvocate = async (advocateId: string, action: 'approve' | 'reject') => {
        try {
            await adminAPI.verifyAdvocate(advocateId, action);
            setPendingAdvocates(prev => prev.filter(a => a._id !== advocateId));
            loadDashboard();
        } catch (err) {
            console.error('Verification failed:', err);
        }
    };

    const formatAction = (action: string) => {
        const actions: Record<string, string> = {
            'case_create': 'Created a case',
            'case_update': 'Updated case',
            'advocate_hire': 'Hired an advocate',
            'advocate_approve': 'Approved advocate',
            'advocate_reject': 'Rejected advocate',
            'login': 'Logged in',
            'document_upload': 'Uploaded document'
        };
        return actions[action] || action;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={48} />
                <h2>Failed to load dashboard</h2>
                <Button onClick={loadDashboard}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <section className="dashboard-header">
                <div className="header-content">
                    <h1>Admin Dashboard</h1>
                    <p>Monitor platform activity and manage users</p>
                </div>
                <div className="header-actions">
                    <Link to="/admin/settings">
                        <Button variant="secondary">
                            <Settings size={18} />
                            Settings
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon users">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.totalUsers.toLocaleString()}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <Link to="/admin/users" className="stat-link">
                        <ArrowUpRight size={16} />
                    </Link>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon advocates">
                        <Shield size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.activeAdvocates}</span>
                        <span className="stat-label">Active Advocates</span>
                    </div>
                    <Link to="/admin/advocates" className="stat-link">
                        <ArrowUpRight size={16} />
                    </Link>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon cases">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.totalCases.toLocaleString()}</span>
                        <span className="stat-label">Total Cases</span>
                    </div>
                    <Link to="/admin/cases" className="stat-link">
                        <ArrowUpRight size={16} />
                    </Link>
                </GlassCard>

                <GlassCard className={`stat-card ${data.stats.urgentCases > 0 ? 'urgent' : ''}`}>
                    <div className="stat-icon urgent">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.urgentCases}</span>
                        <span className="stat-label">Urgent Cases</span>
                    </div>
                    {data.stats.urgentCases > 0 && <div className="stat-pulse" />}
                </GlassCard>

                <GlassCard className={`stat-card ${data.stats.pendingVerifications > 0 ? 'pending' : ''}`}>
                    <div className="stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.pendingVerifications}</span>
                        <span className="stat-label">Pending Verifications</span>
                    </div>
                    {data.stats.pendingVerifications > 0 && <div className="stat-pulse" />}
                </GlassCard>
            </section>

            {/* Main Content */}
            <div className="dashboard-grid">
                {/* Pending Verifications */}
                <GlassCard className="verifications-card">
                    <div className="card-header">
                        <h2>
                            <UserCheck size={20} />
                            Pending Verifications
                        </h2>
                        <Badge variant="warning">{pendingAdvocates.length}</Badge>
                    </div>

                    <div className="verifications-list">
                        {pendingAdvocates.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle size={40} />
                                <p>All verifications complete!</p>
                            </div>
                        ) : (
                            pendingAdvocates.map((advocate) => (
                                <div key={advocate._id} className="verification-item">
                                    <div className="advocate-info">
                                        <div className="advocate-avatar">
                                            {advocate.userId?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                                        </div>
                                        <div className="advocate-details">
                                            <h3>{advocate.userId?.name}</h3>
                                            <span className="advocate-email">{advocate.userId?.email}</span>
                                            <div className="advocate-meta">
                                                <span>Bar: {advocate.barCouncilId}</span>
                                                <span>{advocate.experienceYears} years exp.</span>
                                            </div>
                                            <div className="advocate-specializations">
                                                {advocate.specialization?.map((spec: string, i: number) => (
                                                    <Badge key={i} variant="default" size="sm">{spec}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="verification-actions">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleVerifyAdvocate(advocate._id, 'approve')}
                                        >
                                            <CheckCircle size={16} />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleVerifyAdvocate(advocate._id, 'reject')}
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Recent Activity */}
                <GlassCard className="activity-card">
                    <div className="card-header">
                        <h2>
                            <Activity size={20} />
                            Recent Activity
                        </h2>
                        <Link to="/admin/activity" className="view-all">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="activity-list">
                        {data.recentActivity.map((activity) => (
                            <div key={activity._id} className="activity-item">
                                <div className="activity-icon">
                                    <Users size={16} />
                                </div>
                                <div className="activity-content">
                                    <span className="activity-user">{activity.userId?.name || 'Unknown'}</span>
                                    <span className="activity-action">{formatAction(activity.action)}</span>
                                </div>
                                <span className="activity-time">{formatTime(activity.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* AI Stats */}
                <GlassCard className="ai-stats-card">
                    <div className="card-header">
                        <h2>
                            <Brain size={20} />
                            AI Usage Statistics
                        </h2>
                        <Link to="/admin/ai-logs" className="view-all">
                            View Logs <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="ai-stats-grid">
                        {data.aiStats.map((stat) => (
                            <div key={stat._id} className="ai-stat-item">
                                <span className="ai-stat-type">{stat._id}</span>
                                <span className="ai-stat-count">{stat.count.toLocaleString()}</span>
                                <span className="ai-stat-tokens">~{Math.round(stat.avgTokens)} tokens/req</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Quick Links */}
                <GlassCard className="quick-links-card">
                    <h2>Quick Access</h2>
                    <div className="quick-links-grid">
                        <Link to="/admin/users" className="quick-link">
                            <Users size={24} />
                            <span>Manage Users</span>
                        </Link>
                        <Link to="/admin/advocates" className="quick-link">
                            <Shield size={24} />
                            <span>Advocates</span>
                        </Link>
                        <Link to="/admin/cases" className="quick-link">
                            <Briefcase size={24} />
                            <span>All Cases</span>
                        </Link>
                        <Link to="/admin/ai-logs" className="quick-link">
                            <Brain size={24} />
                            <span>AI Logs</span>
                        </Link>
                        <Link to="/admin/analytics" className="quick-link">
                            <BarChart3 size={24} />
                            <span>Analytics</span>
                        </Link>
                        <Link to="/admin/settings" className="quick-link">
                            <Settings size={24} />
                            <span>Settings</span>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
