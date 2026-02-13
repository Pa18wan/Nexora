import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Briefcase, Calendar, MapPin, AlertTriangle, CheckCircle,
    Clock, FileText, User, Shield, ChevronLeft, Send,
    Download, Activity
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { casesAPI, documentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CaseDetails.css';

interface CaseData {
    _id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    status: string;
    priority: 'urgent' | 'high' | 'normal' | 'low';
    clientNotes?: string;
    aiAnalysis?: {
        urgencyLevel: string;
        riskScore: number;
        summary: string;
    };
    clientId: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
    };
    advocateId?: {
        userId: {
            name: string;
            email: string;
        };
        specialization: string[];
    };
    timeline: {
        event: string;
        description: string;
        date: string;
        createdBy?: {
            name: string;
        };
    }[];
    createdAt: string;
}

interface CaseDocument {
    _id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export function CaseDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCaseDetails();
            fetchDocuments();
        }
    }, [id]);

    const fetchCaseDetails = async () => {
        setIsLoading(true);
        try {
            const response = await casesAPI.getById(id!);
            if (response.data.success) {
                setCaseData(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load case details');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await documentsAPI.list(id!);
            if (response.data.success) {
                setDocuments(response.data.data.documents || []);
            }
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!caseData) return;
        setStatusUpdating(true);
        try {
            await casesAPI.updateStatus(caseData._id, newStatus, 'Status updated via dashboard');
            setCaseData({ ...caseData, status: newStatus });
            // Refresh timeline
            fetchCaseDetails();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDownload = async (docId: string, filename: string) => {
        try {
            const response = await documentsAPI.download(docId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
            'submitted': 'default',
            'analyzing': 'info',
            'pending_advocate': 'warning',
            'advocate_assigned': 'primary',
            'in_progress': 'info',
            'resolved': 'success',
            'closed': 'secondary'
        };
        return colors[status] || 'default';
    };

    if (isLoading) {
        return <div className="loading-state">Loading case details...</div>;
    }

    if (error || !caseData) {
        return (
            <div className="error-state">
                <AlertTriangle size={48} />
                <h2>Error Loading Case</h2>
                <p>{error || 'Case not found'}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const isAdvocate = user?.role === 'advocate';
    const canUpdateStatus = isAdvocate || user?.role === 'admin';

    return (
        <div className="case-details-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-top">
                    <Button variant="ghost" className="back-btn" onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} /> Back
                    </Button>
                    {canUpdateStatus && caseData.status !== 'closed' && (
                        <div className="status-actions">
                            {caseData.status !== 'in_progress' && (
                                <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate('in_progress')}
                                    isLoading={statusUpdating}
                                >
                                    Mark In Progress
                                </Button>
                            )}
                            {caseData.status !== 'resolved' && (
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => handleStatusUpdate('resolved')}
                                    isLoading={statusUpdating}
                                >
                                    Resolve Case
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="case-title-section">
                    <div className="title-row">
                        <h1>{caseData.title}</h1>
                        <Badge variant={getStatusColor(caseData.status)} size="md">
                            {caseData.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                    <div className="meta-row">
                        <span className="case-id">ID: {caseData._id.substring(0, 8)}</span>
                        <span className="dot">•</span>
                        <span className="case-date">
                            <Calendar size={14} />
                            {new Date(caseData.createdAt).toLocaleDateString()}
                        </span>
                        <span className="dot">•</span>
                        <Badge variant={caseData.priority === 'urgent' ? 'danger' : 'info'} size="sm">
                            {caseData.priority.toUpperCase()} PRIORITY
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="case-content-grid">
                {/* Left Column: Details */}
                <div className="details-col">
                    {/* Overview */}
                    <GlassCard className="detail-card">
                        <h2>Case Overview</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Category</label>
                                <span>{caseData.category}</span>
                            </div>
                            <div className="info-item">
                                <label>Location</label>
                                <span>{caseData.location}</span>
                            </div>
                            <div className="info-item full-width">
                                <label>Description</label>
                                <p>{caseData.description}</p>
                            </div>
                            {caseData.clientNotes && (
                                <div className="info-item full-width">
                                    <label>Client Notes</label>
                                    <p className="notes">{caseData.clientNotes}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* AI Analysis */}
                    {caseData.aiAnalysis && (
                        <GlassCard className="detail-card ai-analysis">
                            <div className="card-header-icon">
                                <Activity size={20} />
                                <h2>AI Legal Analysis</h2>
                            </div>
                            <div className="analysis-content">
                                <div className="score-row">
                                    <div className="score-item">
                                        <label>Urgency Score</label>
                                        <span className={`score ${caseData.aiAnalysis.urgencyLevel}`}>
                                            {caseData.aiAnalysis.urgencyLevel.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="score-item">
                                        <label>Risk Assessment</label>
                                        <span className="score">
                                            {caseData.aiAnalysis.riskScore}/10
                                        </span>
                                    </div>
                                </div>
                                {/* AI Summary would go here if available in backend model */}
                            </div>
                        </GlassCard>
                    )}

                    {/* Documents */}
                    <GlassCard className="detail-card">
                        <div className="card-header-row">
                            <h2>Documents</h2>
                            <Button variant="ghost" size="sm">Upload New</Button>
                        </div>
                        <div className="documents-list">
                            {documents.length === 0 ? (
                                <p className="empty-text">No documents attached to this case.</p>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc._id} className="doc-item">
                                        <div className="doc-icon">
                                            <FileText size={20} />
                                        </div>
                                        <div className="doc-info">
                                            <span className="doc-name">{doc.originalName}</span>
                                            <span className="doc-size">{(doc.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(doc._id, doc.originalName)}
                                        >
                                            <Download size={16} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: People & Timeline */}
                <div className="sidebar-col">
                    {/* People */}
                    <GlassCard className="detail-card">
                        <h2>Involved Parties</h2>
                        <div className="people-list">
                            <div className="person-item">
                                <div className="person-role">Client</div>
                                <div className="person-info">
                                    <div className="avatar">{caseData.clientId.name[0]}</div>
                                    <div>
                                        <div className="name">{caseData.clientId.name}</div>
                                        <div className="email">{caseData.clientId.email}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div className="person-item">
                                <div className="person-role">Assigned Advocate</div>
                                {caseData.advocateId ? (
                                    <div className="person-info">
                                        <div className="avatar advocate">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <div className="name">{caseData.advocateId.userId.name}</div>
                                            <div className="specialization">
                                                {caseData.advocateId.specialization[0]}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-assignee">
                                        <AlertTriangle size={16} />
                                        <span>No advocate assigned yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Timeline */}
                    <GlassCard className="detail-card">
                        <h2>Case Timeline</h2>
                        <div className="timeline">
                            {caseData.timeline && caseData.timeline.slice().reverse().map((event, index) => (
                                <div key={index} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <div className="event-name">{event.event}</div>
                                        <div className="event-desc">{event.description}</div>
                                        <div className="event-time">
                                            <Clock size={12} />
                                            {typeof event.date === 'string' ? new Date(event.date).toLocaleString() : 'Just now'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
