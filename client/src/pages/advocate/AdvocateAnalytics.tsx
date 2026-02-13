import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Briefcase, Star,
    Zap, Calendar, Download, DollarSign, Target
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { advocatePanelAPI } from '../../services/api';
import './AdvocateDashboard.css'; // Reusing some styles

export function AdvocateAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        // Simulate fetching analytics data
        setTimeout(() => setIsLoading(false), 1000);
    }, [timeRange]);

    return (
        <div className="advocate-dashboard">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1>Performance Analytics</h1>
                        <p>Track your case success, ratings, and earning trends</p>
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
                    </select>
                    <Button variant="secondary">
                        <Download size={16} />
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon active">
                        <Star size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">4.9</span>
                        <span className="stat-label">Avg. Rating</span>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+0.2</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon success">
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">92%</span>
                        <span className="stat-label">Success Rate</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon purple">
                        <Zap size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">85%</span>
                        <span className="stat-label">Match Relevancy</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon urgent">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">₹45,200</span>
                        <span className="stat-label">Monthly Revenue</span>
                    </div>
                    <div className="stat-trend positive">
                        <TrendingUp size={14} />
                        <span>+15%</span>
                    </div>
                </GlassCard>
            </div>

            <div className="dashboard-grid">
                <GlassCard className="chart-card large">
                    <div className="card-header">
                        <h2>Client Acquisitions</h2>
                        <Badge variant="success">GROWING</Badge>
                    </div>
                    <div className="placeholder-chart">
                        <TrendingUp size={64} className="chart-icon" />
                        <p>Your client growth chart over {timeRange}</p>
                    </div>
                </GlassCard>

                <GlassCard className="chart-card">
                    <div className="card-header">
                        <h2>Workload Distribution</h2>
                    </div>
                    <div className="category-stats">
                        {[
                            { name: 'Active Cases', count: 8, color: '#3b82f6' },
                            { name: 'Consultations', count: 12, color: '#8b5cf6' },
                            { name: 'Document Prep', count: 5, color: '#ec4899' },
                            { name: 'Research', count: 4, color: '#06b6d4' }
                        ].map(item => (
                            <div key={item.name} className="cat-item">
                                <div className="cat-info">
                                    <span>{item.name}</span>
                                    <span>{item.count}</span>
                                </div>
                                <div className="cat-bar-bg">
                                    <div
                                        className="cat-bar"
                                        style={{ width: `${(item.count / 12) * 100}%`, backgroundColor: item.color }}
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
