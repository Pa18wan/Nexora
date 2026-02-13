import { useState, useEffect } from 'react';
import {
    Users, Clock, CheckCircle, XCircle,
    ArrowUpRight, Info, Filter, Search
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { advocatePanelAPI } from '../../services/api';
import './AdvocateDashboard.css'; // Reusing some styles

interface Request {
    _id: string;
    title: string;
    category: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    clientId: {
        name: string;
        email: string;
    };
    aiAnalysis: {
        urgencyScore: number;
        matchScore: number;
    };
    createdAt: string;
}

export function AdvocateRequests() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [respondingTo, setRespondingTo] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await advocatePanelAPI.getDashboard(); // Requests are part of dashboard
            if (response.data.success) {
                setRequests(response.data.data.requests || []);
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRespond = async (caseId: string, action: 'accept' | 'reject') => {
        try {
            setRespondingTo(caseId);
            await advocatePanelAPI.respondToRequest(caseId, action);
            setRequests(prev => prev.filter(r => r._id !== caseId));
        } catch (error) {
            console.error('Failed to respond:', error);
        } finally {
            setRespondingTo(null);
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

    const filteredRequests = requests.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.clientId.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="advocate-dashboard">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1>Case Requests</h1>
                        <p>Review and respond to new case invitations</p>
                    </div>
                </div>
            </div>

            <GlassCard variant="liquid" className="controls-card">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by client or case title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </GlassCard>

            {isLoading ? (
                <div className="loading-state">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <h3>No pending requests</h3>
                    <p>When clients hire you, their requests will appear here.</p>
                </GlassCard>
            ) : (
                <div className="requests-grid">
                    {filteredRequests.map((req) => (
                        <GlassCard key={req._id} variant="liquid" className="request-card-large">
                            <div className="request-body">
                                <div className="request-main-info">
                                    <div className="request-header-row">
                                        <h3>{req.title}</h3>
                                        <Badge variant={getUrgencyBadge(req.urgencyLevel)}>
                                            {req.urgencyLevel.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="request-meta-row">
                                        <span className="client-name">
                                            <Users size={16} />
                                            {req.clientId.name}
                                        </span>
                                        <span className="case-category">{req.category}</span>
                                        <span className="request-date">
                                            <Clock size={16} />
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="ai-matching-info">
                                        <div className="match-bar-container">
                                            <div className="match-label">AI Match Score</div>
                                            <div className="match-bar-bg">
                                                <div
                                                    className="match-bar-fill"
                                                    style={{ width: `${req.aiAnalysis.matchScore}%` }}
                                                />
                                            </div>
                                            <div className="match-percentage">{req.aiAnalysis.matchScore}%</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="request-actions-large">
                                    <Button
                                        variant="primary"
                                        onClick={() => handleRespond(req._id, 'accept')}
                                        isLoading={respondingTo === req._id}
                                    >
                                        Accept Case
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleRespond(req._id, 'reject')}
                                        disabled={respondingTo === req._id}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
