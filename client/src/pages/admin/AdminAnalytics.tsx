import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Users, Briefcase, Star,
    Zap, Download, RefreshCcw, Scale, MessageSquare,
    FileText, AlertTriangle, CheckCircle, Clock, MapPin,
    Bot, Shield, Activity, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminAnalytics.css';

interface AnalyticsData {
    overview: any;
    cases: any;
    advocates: any;
    ai: any;
    complaints: any;
    trends: any;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Property Law': '#3b82f6',
    'Criminal Law': '#ef4444',
    'Family Law': '#ec4899',
    'Consumer Law': '#f59e0b',
    'Labor Law': '#10b981',
    'Corporate Law': '#6366f1',
    'Tax Law': '#8b5cf6',
    'Cyber Crime': '#06b6d4',
    'Constitutional Law': '#f97316',
    'Uncategorized': '#6b7280'
};

const STATUS_COLORS: Record<string, string> = {
    'submitted': '#f59e0b',
    'pending_advocate': '#f97316',
    'assigned': '#3b82f6',
    'in_progress': '#6366f1',
    'in_review': '#8b5cf6',
    'completed': '#10b981',
    'closed': '#6b7280'
};

const URGENCY_COLORS: Record<string, string> = {
    'critical': '#ef4444',
    'high': '#f97316',
    'medium': '#f59e0b',
    'low': '#10b981',
    'unknown': '#6b7280'
};

export function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await adminAPI.getAnalytics();
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="analytics-page">
                <div className="loading-state">
                    <Loader2 size={40} className="spin" />
                    <p>Loading platform analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="analytics-page">
                <div className="error-state">
                    <AlertTriangle size={40} />
                    <p>{error || 'No analytics data available'}</p>
                    <Button onClick={fetchAnalytics}>
                        <RefreshCcw size={16} />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const { overview, cases, advocates, ai, complaints, trends } = data;
    const maxCategoryCount = Math.max(...(cases.categories?.map((c: any) => c.count) || [1]));
    const maxStatusCount = Math.max(...(cases.statuses?.map((s: any) => s.count) || [1]));

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1>Platform Analytics</h1>
                        <p>Real-time performance metrics and insights</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" onClick={fetchAnalytics}>
                        <RefreshCcw size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="analytics-stats-grid">
                <GlassCard className="stat-card gradient-blue">
                    <div className="stat-icon-wrap">
                        <Users size={22} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-value">{overview.totalUsers}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{overview.totalClients} clients</span>
                        <span>{overview.totalAdvocates} advocates</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card gradient-purple">
                    <div className="stat-icon-wrap">
                        <Briefcase size={22} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-value">{overview.totalCases}</span>
                        <span className="stat-label">Total Cases</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{overview.totalDocuments} documents</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card gradient-cyan">
                    <div className="stat-icon-wrap">
                        <Bot size={22} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-value">{ai.totalInteractions}</span>
                        <span className="stat-label">AI Interactions</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{ai.chatSessions} chats</span>
                        <span>{ai.caseAnalyses} analyses</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card gradient-green">
                    <div className="stat-icon-wrap">
                        <Star size={22} />
                    </div>
                    <div className="stat-data">
                        <span className="stat-value">{advocates.avgRating}</span>
                        <span className="stat-label">Avg Rating</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{overview.totalReviews} reviews</span>
                    </div>
                </GlassCard>
            </div>

            {/* Charts Grid */}
            <div className="analytics-grid">
                {/* Monthly Growth Chart */}
                <GlassCard className="chart-card wide">
                    <div className="chart-header">
                        <div>
                            <h2>Monthly Growth</h2>
                            <p>User registrations & cases over last 6 months</p>
                        </div>
                        <Badge variant="primary" className="live-badge">
                            <Activity size={12} />
                            LIVE
                        </Badge>
                    </div>
                    <div className="bar-chart">
                        {trends.monthlyGrowth?.map((m: any, i: number) => {
                            const maxVal = Math.max(...trends.monthlyGrowth.map((g: any) => Math.max(g.users, g.cases)), 1);
                            return (
                                <div key={i} className="bar-group">
                                    <div className="bars">
                                        <div
                                            className="bar users-bar"
                                            style={{ height: `${(m.users / maxVal) * 100}%` }}
                                            title={`${m.users} users`}
                                        >
                                            <span className="bar-tooltip">{m.users}</span>
                                        </div>
                                        <div
                                            className="bar cases-bar"
                                            style={{ height: `${(m.cases / maxVal) * 100}%` }}
                                            title={`${m.cases} cases`}
                                        >
                                            <span className="bar-tooltip">{m.cases}</span>
                                        </div>
                                    </div>
                                    <span className="bar-label">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chart-legend">
                        <span className="legend-item"><span className="legend-dot users"></span> Users</span>
                        <span className="legend-item"><span className="legend-dot cases"></span> Cases</span>
                    </div>
                </GlassCard>

                {/* Case Categories */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Case Categories</h2>
                            <p>Distribution by legal domain</p>
                        </div>
                    </div>
                    <div className="category-list">
                        {cases.categories?.map((cat: any) => (
                            <div key={cat.name} className="category-item">
                                <div className="cat-info">
                                    <div className="cat-dot" style={{ background: CATEGORY_COLORS[cat.name] || '#6b7280' }} />
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-count">{cat.count}</span>
                                </div>
                                <div className="cat-bar-bg">
                                    <div
                                        className="cat-bar-fill"
                                        style={{
                                            width: `${(cat.count / maxCategoryCount) * 100}%`,
                                            background: `linear-gradient(90deg, ${CATEGORY_COLORS[cat.name] || '#6b7280'}, ${CATEGORY_COLORS[cat.name] || '#6b7280'}88)`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Case Status */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Case Status</h2>
                            <p>Current status breakdown</p>
                        </div>
                    </div>
                    <div className="status-donut">
                        <div className="donut-chart">
                            <svg viewBox="0 0 120 120">
                                {(() => {
                                    const total = cases.statuses?.reduce((s: number, c: any) => s + c.count, 0) || 1;
                                    let cumulativePercent = 0;
                                    return cases.statuses?.map((s: any, i: number) => {
                                        const percent = (s.count / total) * 100;
                                        const dashArray = `${percent * 3.14} ${314 - percent * 3.14}`;
                                        const dashOffset = -cumulativePercent * 3.14;
                                        cumulativePercent += percent;
                                        return (
                                            <circle
                                                key={i}
                                                cx="60" cy="60" r="50"
                                                fill="none"
                                                stroke={STATUS_COLORS[s.name] || '#6b7280'}
                                                strokeWidth="12"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={dashOffset}
                                                style={{ transition: 'all 0.5s ease' }}
                                            />
                                        );
                                    });
                                })()}
                                <text x="60" y="55" textAnchor="middle" className="donut-total" fill="currentColor" fontSize="20" fontWeight="700">{overview.totalCases}</text>
                                <text x="60" y="72" textAnchor="middle" className="donut-label" fill="currentColor" fontSize="10" opacity="0.6">cases</text>
                            </svg>
                        </div>
                        <div className="status-legend">
                            {cases.statuses?.map((s: any) => (
                                <div key={s.name} className="legend-row">
                                    <span className="legend-color" style={{ background: STATUS_COLORS[s.name] || '#6b7280' }} />
                                    <span className="legend-name">{s.name.replace(/_/g, ' ')}</span>
                                    <span className="legend-value">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Urgency Distribution */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Urgency Levels</h2>
                            <p>Case urgency breakdown</p>
                        </div>
                    </div>
                    <div className="urgency-grid">
                        {cases.urgencyDistribution?.map((u: any) => (
                            <div key={u.level} className="urgency-card" style={{ borderColor: URGENCY_COLORS[u.level] || '#6b7280' }}>
                                <AlertTriangle size={18} style={{ color: URGENCY_COLORS[u.level] || '#6b7280' }} />
                                <span className="urgency-count">{u.count}</span>
                                <span className="urgency-label">{u.level}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Top Advocates */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Top Advocates</h2>
                            <p>Highest rated verified advocates</p>
                        </div>
                    </div>
                    <div className="top-advocates-list">
                        {advocates.topAdvocates?.map((adv: any, i: number) => (
                            <div key={adv.id || i} className="top-advocate-item">
                                <div className="advocate-rank">#{i + 1}</div>
                                <div className="advocate-info">
                                    <span className="advocate-name">{adv.name || 'Unknown'}</span>
                                    <span className="advocate-spec">{adv.specialization?.slice(0, 2).join(', ')}</span>
                                </div>
                                <div className="advocate-stats">
                                    <span className="advocate-rating">
                                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                        {adv.rating}
                                    </span>
                                    <span className="advocate-cases">{adv.totalCases} cases</span>
                                    <span className="advocate-success">{adv.successRate}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Complaints */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Complaints</h2>
                            <p>Support ticket status</p>
                        </div>
                    </div>
                    <div className="complaints-summary">
                        <div className="complaint-stat">
                            <div className="complaint-icon pending">
                                <Clock size={20} />
                            </div>
                            <span className="complaint-count">{complaints.pending}</span>
                            <span className="complaint-label">Pending</span>
                        </div>
                        <div className="complaint-stat">
                            <div className="complaint-icon progress">
                                <Activity size={20} />
                            </div>
                            <span className="complaint-count">{complaints.inProgress}</span>
                            <span className="complaint-label">In Progress</span>
                        </div>
                        <div className="complaint-stat">
                            <div className="complaint-icon resolved">
                                <CheckCircle size={20} />
                            </div>
                            <span className="complaint-count">{complaints.resolved}</span>
                            <span className="complaint-label">Resolved</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Location Distribution */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Case Locations</h2>
                            <p>Geographic distribution</p>
                        </div>
                    </div>
                    <div className="location-list">
                        {trends.locationDistribution?.map((loc: any, i: number) => (
                            <div key={loc.city} className="location-item">
                                <div className="location-info">
                                    <MapPin size={14} />
                                    <span>{loc.city}</span>
                                </div>
                                <div className="location-bar-bg">
                                    <div
                                        className="location-bar-fill"
                                        style={{
                                            width: `${(loc.count / (trends.locationDistribution[0]?.count || 1)) * 100}%`
                                        }}
                                    />
                                </div>
                                <span className="location-count">{loc.count}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Platform Summary */}
                <GlassCard className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h2>Platform Health</h2>
                            <p>System overview</p>
                        </div>
                    </div>
                    <div className="health-grid">
                        <div className="health-item">
                            <Shield size={18} />
                            <div>
                                <span className="health-val">{overview.verifiedUsers}</span>
                                <span className="health-lbl">Verified Users</span>
                            </div>
                        </div>
                        <div className="health-item">
                            <Activity size={18} />
                            <div>
                                <span className="health-val">{overview.activeUsers}</span>
                                <span className="health-lbl">Active Users</span>
                            </div>
                        </div>
                        <div className="health-item">
                            <FileText size={18} />
                            <div>
                                <span className="health-val">{overview.totalDocuments}</span>
                                <span className="health-lbl">Documents</span>
                            </div>
                        </div>
                        <div className="health-item">
                            <MessageSquare size={18} />
                            <div>
                                <span className="health-val">{overview.totalNotifications}</span>
                                <span className="health-lbl">Notifications</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
