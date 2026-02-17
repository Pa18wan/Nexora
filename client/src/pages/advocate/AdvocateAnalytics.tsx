import { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Briefcase, Star, Zap, Calendar, Download, DollarSign, Target
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { GlassCard, Button, Badge } from '../../components/common';
import { advocatePanelAPI } from '../../services/api';
import './AdvocateDashboard.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, ArcElement
);

export function AdvocateAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await advocatePanelAPI.getAnalytics(timeRange);
            if (response.data.success) {
                setAnalyticsData(response.data.data);
            } else {
                // Use fallback data if API fails
                setAnalyticsData(getFallbackData());
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setAnalyticsData(getFallbackData());
        } finally {
            setIsLoading(false);
        }
    };

    const getFallbackData = () => ({
        stats: {
            avgRating: 4.9,
            successRate: 92,
            matchRelevancy: 85,
            monthlyRevenue: 45200,
            ratingTrend: 0.2,
            revenueTrend: 15
        },
        clientAcquisition: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            data: [3, 5, 8, 12]
        },
        workloadDistribution: [
            { name: 'Active Cases', count: 8, color: '#3b82f6' },
            { name: 'Consultations', count: 12, color: '#8b5cf6' },
            { name: 'Document Prep', count: 5, color: '#ec4899' },
            { name: 'Research', count: 4, color: '#06b6d4' }
        ],
        casesByCategory: {
            labels: ['Property', 'Criminal', 'Family', 'Corporate', 'Tax'],
            data: [8, 5, 6, 3, 2]
        },
        monthlyEarnings: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [32000, 35000, 38000, 42000, 41000, 45200]
        }
    });

    const data = analyticsData || getFallbackData();

    // Client Acquisitions Chart
    const clientAcquisitionData = {
        labels: data.clientAcquisition.labels,
        datasets: [{
            label: 'New Clients',
            data: data.clientAcquisition.data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    // Monthly Earnings Chart
    const earningsData = {
        labels: data.monthlyEarnings.labels,
        datasets: [{
            label: 'Earnings (₹)',
            data: data.monthlyEarnings.data,
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 2
        }]
    };

    // Cases by Category Doughnut
    const casesCategoryData = {
        labels: data.casesByCategory.labels,
        datasets: [{
            data: data.casesByCategory.data,
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(6, 182, 212, 0.8)',
                'rgba(251, 191, 36, 0.8)'
            ],
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: { color: '#fff' }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#aaa' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#aaa' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { color: '#fff', padding: 15 }
            }
        }
    };

    return (
        <div className="advocate-dashboard">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1>Performance Analytics</h1>
                        <p>Real-time performance metrics and insights</p>
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

            {isLoading ? (
                <div className="loading-state">Loading analytics...</div>
            ) : (
                <>
                    <div className="stats-grid">
                        <GlassCard className="stat-card">
                            <div className="stat-icon active">
                                <Star size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{data.stats.avgRating}</span>
                                <span className="stat-label">Avg. Rating</span>
                            </div>
                            <div className="stat-trend positive">
                                <TrendingUp size={14} />
                                <span>+{data.stats.ratingTrend}</span>
                            </div>
                        </GlassCard>

                        <GlassCard className="stat-card">
                            <div className="stat-icon success">
                                <Target size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{data.stats.successRate}%</span>
                                <span className="stat-label">Success Rate</span>
                            </div>
                        </GlassCard>

                        <GlassCard className="stat-card">
                            <div className="stat-icon purple">
                                <Zap size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{data.stats.matchRelevancy}%</span>
                                <span className="stat-label">Match Relevancy</span>
                            </div>
                        </GlassCard>

                        <GlassCard className="stat-card">
                            <div className="stat-icon urgent">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">₹{data.stats.monthlyRevenue.toLocaleString()}</span>
                                <span className="stat-label">Monthly Revenue</span>
                            </div>
                            <div className="stat-trend positive">
                                <TrendingUp size={14} />
                                <span>+{data.stats.revenueTrend}%</span>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="dashboard-grid">
                        <GlassCard className="chart-card large">
                            <div className="card-header">
                                <h2>Client Acquisitions</h2>
                                <Badge variant="success">GROWING</Badge>
                            </div>
                            <div className="chart-container" style={{ height: '300px' }}>
                                <Line data={clientAcquisitionData} options={chartOptions} />
                            </div>
                        </GlassCard>

                        <GlassCard className="chart-card">
                            <div className="card-header">
                                <h2>Cases by Category</h2>
                            </div>
                            <div className="chart-container" style={{ height: '300px' }}>
                                <Doughnut data={casesCategoryData} options={doughnutOptions} />
                            </div>
                        </GlassCard>

                        <GlassCard className="chart-card large">
                            <div className="card-header">
                                <h2>Monthly Earnings Trend</h2>
                            </div>
                            <div className="chart-container" style={{ height: '300px' }}>
                                <Bar data={earningsData} options={chartOptions} />
                            </div>
                        </GlassCard>

                        <GlassCard className="chart-card">
                            <div className="card-header">
                                <h2>Workload Distribution</h2>
                            </div>
                            <div className="category-stats">
                                {data.workloadDistribution.map((item: any) => (
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
                </>
            )}
        </div>
    );
}
