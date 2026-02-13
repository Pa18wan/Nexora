import { useState, useEffect } from 'react';
import {
    AlertCircle, Search, Filter, CheckCircle,
    XCircle, MessageSquare, ChevronDown
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminComplaints.css';

interface Complaint {
    _id: string;
    type: string;
    description: string;
    raisedBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    againstAdvocate: {
        _id: string;
        userId: {
            name: string;
            email: string;
        };
    };
    caseId?: {
        title: string;
        caseNumber: string;
    };
    status: 'pending' | 'resolved' | 'dismissed';
    resolutionNotes?: string;
    createdAt: string;
}

export function AdminComplaints() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchComplaints();
    }, [filterStatus]);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await adminAPI.getComplaints(params);
            if (response.data.success) {
                setComplaints(response.data.data.complaints || []);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (id: string, action: 'resolved' | 'dismissed') => {
        setActionLoading(id);
        try {
            await adminAPI.resolveComplaint(id, action, resolutionNotes[id]);
            // Optimistic update
            setComplaints(prev => prev.map(c =>
                c._id === id ? { ...c, status: action, resolutionNotes: resolutionNotes[id] } : c
            ));
        } catch (err) {
            console.error('Failed to resolve complaint:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved': return <Badge variant="success">Resolved</Badge>;
            case 'dismissed': return <Badge variant="secondary">Dismissed</Badge>;
            case 'pending': return <Badge variant="warning">Pending</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="admin-complaints-page">
            <div className="page-header">
                <h1>Complaints Management</h1>
                <div className="header-actions">
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="status-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="complaints-list">
                {isLoading ? (
                    <div className="loading-text">Loading complaints...</div>
                ) : complaints.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <p>No complaints found.</p>
                    </div>
                ) : (
                    complaints.map(complaint => (
                        <GlassCard key={complaint._id} className="complaint-card">
                            <div className="complaint-header">
                                <div className="complaint-meta">
                                    <span className="complaint-type">{complaint.type.toUpperCase()}</span>
                                    <span className="complaint-date">
                                        {new Date(complaint.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {getStatusBadge(complaint.status)}
                            </div>

                            <div className="complaint-body">
                                <div className="parties-row">
                                    <div className="party">
                                        <label>Reported By</label>
                                        <span>{complaint.raisedBy.name} ({complaint.raisedBy.role})</span>
                                    </div>
                                    <div className="party">
                                        <label>Against</label>
                                        <span>{complaint.againstAdvocate.userId.name} (Advocate)</span>
                                    </div>
                                    {complaint.caseId && (
                                        <div className="party">
                                            <label>Case</label>
                                            <span>{complaint.caseId.title}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="description">
                                    <label>Description</label>
                                    <p>{complaint.description}</p>
                                </div>

                                {complaint.status === 'pending' ? (
                                    <div className="resolution-area">
                                        <textarea
                                            placeholder="Add resolution notes..."
                                            value={resolutionNotes[complaint._id] || ''}
                                            onChange={(e) => setResolutionNotes({
                                                ...resolutionNotes,
                                                [complaint._id]: e.target.value
                                            })}
                                        />
                                        <div className="action-buttons">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleResolve(complaint._id, 'resolved')}
                                                isLoading={actionLoading === complaint._id}
                                            >
                                                <CheckCircle size={16} /> Resolve
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleResolve(complaint._id, 'dismissed')}
                                                isLoading={actionLoading === complaint._id}
                                            >
                                                <XCircle size={16} /> Dismiss
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="resolution-info">
                                        <label>Resolution Notes</label>
                                        <p>{complaint.resolutionNotes || 'No notes provided.'}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
