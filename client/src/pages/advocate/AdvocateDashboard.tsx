import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, Users, TrendingUp, Clock, Star, CheckCircle,
    AlertTriangle, Calendar, DollarSign, ArrowUpRight, Bell,
    FileText, ChevronRight, UserCheck, XCircle
} from 'lucide-react';
import { Button, GlassCard, Badge } from '../../components/common';
import { advocatePanelAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdvocateDashboard.css';

interface DashboardData {
    profile: {
        name: string;
        rating: number;
        totalCases: number;
        successRate: number;
        isAvailable: boolean;
    };
    stats: {
        activeCases: number;
        pendingRequests: number;
        completedCases: number;
        urgentCases: number;
        totalCases: number;
    };
    recentCases: any[];
    requests: any[];
    earnings: {
        total: number;
        thisMonth: number;
        pending: number;
    };
    unreadNotifications: number;
}

export function AdvocateDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setIsLoading(true);
            const response = await advocatePanelAPI.getDashboard();
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load dashboard');
            // Fallback mock data
            setData({
                profile: {
                    name: user?.name || 'Advocate',
                    rating: 4.8,
                    totalCases: 156,
                    successRate: 94,
                    isAvailable: true
                },
                stats: {
                    activeCases: 8,
                    pendingRequests: 3,
                    completedCases: 148,
                    urgentCases: 2,
                    totalCases: 156
                },
                recentCases: [
                    {
                        _id: '1',
                        title: 'Property Dispute - Land Registration',
                        category: 'Property',
                        status: 'in_progress',
                        urgencyLevel: 'high',
                        clientId: { name: 'Rajesh Kumar' },
                        aiAnalysis: { urgencyScore: 85 }
                    },
                    {
                        _id: '2',
                        title: 'Corporate Merger Documentation',
                        category: 'Corporate',
                        status: 'in_review',
                        urgencyLevel: 'medium',
                        clientId: { name: 'Tech Solutions Pvt Ltd' },
                        aiAnalysis: { urgencyScore: 65 }
                    }
                ],
                requests: [
                    {
                        _id: 'r1',
                        title: 'Divorce Settlement',
                        category: 'Family',
                        urgencyLevel: 'high',
                        clientId: { name: 'Priya Sharma' },
                        aiAnalysis: { urgencyScore: 78, matchScore: 92 },
                        createdAt: new Date().toISOString()
                    },
                    {
                        _id: 'r2',
                        title: 'Labor Dispute Case',
                        category: 'Labor',
                        urgencyLevel: 'medium',
                        clientId: { name: 'Workers Union' },
                        aiAnalysis: { urgencyScore: 60, matchScore: 87 },
                        createdAt: new Date().toISOString()
                    }
                ],
                earnings: {
                    total: 125000,
                    thisMonth: 45000,
                    pending: 15000
                },
                unreadNotifications: 5
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRespondToRequest = async (caseId: string, action: 'accept' | 'reject') => {
        try {
            setRespondingTo(caseId);
            await advocatePanelAPI.respondToRequest(caseId, action);
            loadDashboard(); // Reload data
        } catch (err) {
            console.error('Failed to respond:', err);
        } finally {
            setRespondingTo(null);
        }
    };

    const toggleAvailability = async () => {
        if (!data) return;
        try {
            await advocatePanelAPI.updateProfile({ isAvailable: !data.profile.isAvailable });
            setData({
                ...data,
                profile: { ...data.profile, isAvailable: !data.profile.isAvailable }
            });
        } catch (err) {
            console.error('Failed to update availability:', err);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>Loading dashboard...</p>
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
        <div className="advocate-dashboard">
            {/* Welcome Section */}
            <section className="dashboard-welcome">
                <div className="welcome-content">
                    <h1>Welcome, {data.profile.name?.split(' ')[0]}!</h1>
                    <p>Manage your cases and client requests</p>
                </div>
                <div className="welcome-actions">
                    <div className={`availability-toggle ${data.profile.isAvailable ? 'available' : 'unavailable'}`}>
                        <span>{data.profile.isAvailable ? 'Available' : 'Unavailable'}</span>
                        <button onClick={toggleAvailability} className="toggle-btn">
                            <span className="toggle-slider" />
                        </button>
                    </div>
                    <Link to="/advocate/profile">
                        <Button variant="secondary">Edit Profile</Button>
                    </Link>
                </div>
            </section>

            {/* Profile Stats */}
            <section className="profile-stats">
                <div className="profile-stat">
                    <Star className="star-icon" size={18} />
                    <span className="stat-value">{data.profile.rating}</span>
                    <span className="stat-label">Rating</span>
                </div>
                <div className="divider" />
                <div className="profile-stat">
                    <Briefcase size={18} />
                    <span className="stat-value">{data.profile.totalCases}</span>
                    <span className="stat-label">Total Cases</span>
                </div>
                <div className="divider" />
                <div className="profile-stat">
                    <TrendingUp size={18} />
                    <span className="stat-value">{data.profile.successRate}%</span>
                    <span className="stat-label">Success Rate</span>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon active">
                        <Briefcase size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.activeCases}</span>
                        <span className="stat-label">Active Cases</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card pending">
                    <div className="stat-icon pending">
                        <Clock size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.pendingRequests}</span>
                        <span className="stat-label">Pending Requests</span>
                    </div>
                    {data.stats.pendingRequests > 0 && <div className="stat-pulse" />}
                </GlassCard>

                <GlassCard className={`stat-card ${data.stats.urgentCases > 0 ? 'urgent' : ''}`}>
                    <div className="stat-icon urgent">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.urgentCases}</span>
                        <span className="stat-label">Urgent Cases</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon success">
                        <CheckCircle size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.stats.completedCases}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </GlassCard>
            </section>

            {/* Main Content */}
            <div className="dashboard-grid">
                {/* Case Requests */}
                <GlassCard className="requests-card">
                    <div className="card-header">
                        <h2>
                            <Users size={20} />
                            Case Requests
                        </h2>
                        <Badge variant="primary">{data.stats.pendingRequests} new</Badge>
                    </div>

                    <div className="requests-list">
                        {data.requests.length === 0 ? (
                            <div className="empty-state">
                                <Users size={40} />
                                <p>No pending requests</p>
                            </div>
                        ) : (
                            data.requests.map((request) => (
                                <div key={request._id} className="request-item">
                                    <div className="request-header">
                                        <h3>{request.title}</h3>
                                        <Badge variant={getUrgencyBadge(request.urgencyLevel)}>
                                            {request.urgencyLevel}
                                        </Badge>
                                    </div>
                                    <div className="request-details">
                                        <span className="request-client">
                                            <Users size={14} />
                                            {request.clientId?.name}
                                        </span>
                                        <span className="request-category">{request.category}</span>
                                        {request.aiAnalysis?.matchScore && (
                                            <span className="match-score">
                                                {request.aiAnalysis.matchScore}% match
                                            </span>
                                        )}
                                    </div>
                                    <div className="request-actions">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleRespondToRequest(request._id, 'accept')}
                                            isLoading={respondingTo === request._id}
                                        >
                                            <UserCheck size={16} />
                                            Accept
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRespondToRequest(request._id, 'reject')}
                                            disabled={respondingTo === request._id}
                                        >
                                            <XCircle size={16} />
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {data.requests.length > 0 && (
                        <Link to="/advocate/requests" className="view-all">
                            View All Requests <ChevronRight size={16} />
                        </Link>
                    )}
                </GlassCard>

                {/* Recent Cases */}
                <GlassCard className="cases-card">
                    <div className="card-header">
                        <h2>
                            <FileText size={20} />
                            Active Cases
                        </h2>
                        <Link to="/advocate/cases" className="view-all">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="cases-list">
                        {data.recentCases.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={40} />
                                <p>No active cases</p>
                            </div>
                        ) : (
                            data.recentCases.map((caseItem) => (
                                <GlassCard key={caseItem._id} variant="liquid" className="case-item">
                                    <div className="case-main">
                                        <div className="case-header">
                                            <h3>{caseItem.title}</h3>
                                            <Badge variant={getUrgencyBadge(caseItem.urgencyLevel)}>
                                                {caseItem.urgencyLevel}
                                            </Badge>
                                        </div>
                                        <div className="case-meta">
                                            <span className="case-client">
                                                <Users size={14} />
                                                {caseItem.clientId?.name}
                                            </span>
                                            <span className="case-category">{caseItem.category}</span>
                                        </div>
                                    </div>
                                    <Link to={`/advocate/cases/${caseItem._id}`}>
                                        <Button variant="ghost" size="sm">
                                            View <ArrowUpRight size={14} />
                                        </Button>
                                    </Link>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Earnings & Analytics */}
                <GlassCard className="earnings-card">
                    <div className="card-header">
                        <h2>
                            <DollarSign size={20} />
                            Earnings
                        </h2>
                        <Link to="/advocate/analytics" className="view-all">
                            Analytics <ArrowUpRight size={16} />
                        </Link>
                    </div>

                    <div className="earnings-stats">
                        <div className="earning-item">
                            <span className="earning-label">Total Earnings</span>
                            <span className="earning-value">{formatCurrency(data.earnings.total)}</span>
                        </div>
                        <div className="earning-item">
                            <span className="earning-label">This Month</span>
                            <span className="earning-value highlight">{formatCurrency(data.earnings.thisMonth)}</span>
                        </div>
                        <div className="earning-item">
                            <span className="earning-label">Pending</span>
                            <span className="earning-value pending">{formatCurrency(data.earnings.pending)}</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
