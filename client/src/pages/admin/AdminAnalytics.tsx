import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Users, Briefcase,
    Zap, Calendar, Download, RefreshCcw
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css'; // Reusing some styles

export function AdminAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        // Simulate fetching analytics data
        setTimeout(() => setIsLoading(false), 1000);
    }, [timeRange]);

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1>Platform Analytics</h1>
                        <p>Key performance indicators and system growth metrics</p>
                    </div>
                </div>
                <div className="header-actions">
                    <select
                        className="filter-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>
                    <Button variant="secondary">
                        <Download size={16} />
                        Export
                    </Button>
                </div>
            </div>

            <div className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon users">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">1,248</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+12%</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon cases">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">342</span>
                        <span className="stat-label">Active Cases</span>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+5%</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon purple">
                        <Zap size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">98.5%</span>
                        <span className="stat-label">AI Match Accuracy</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon success">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">₹12.4L</span>
                        <span className="stat-label">Processed Fees</span>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+18%</span>
                    </div>
                </GlassCard>
            </div>

            <div className="dashboard-grid">
                <GlassCard className="chart-card large">
                    <div className="card-header">
                        <h2>User Acquisition</h2>
                        <Badge variant="primary">LIVE</Badge>
                    </div>
                    <div className="placeholder-chart">
                        <TrendingUp size={64} className="chart-icon" />
                        <p>User growth visualization over {timeRange}</p>
                    </div>
                </GlassCard>

                <GlassCard className="chart-card">
                    <div className="card-header">
                        <h2>Case Categories</h2>
                    </div>
                    <div className="category-stats">
                        {[
                            { name: 'Property', count: 125, color: '#3b82f6' },
                            { name: 'Criminal', count: 84, color: '#8b5cf6' },
                            { name: 'Family', count: 65, color: '#ec4899' },
                            { name: 'Corporate', count: 42, color: '#06b6d4' }
                        ].map(cat => (
                            <div key={cat.name} className="cat-item">
                                <div className="cat-info">
                                    <span>{cat.name}</span>
                                    <span>{cat.count}</span>
                                </div>
                                <div className="cat-bar-bg">
                                    <div
                                        className="cat-bar"
                                        style={{ width: `${(cat.count / 125) * 100}%`, backgroundColor: cat.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

// Minimal missing icons
import { CheckCircle } from 'lucide-react';
