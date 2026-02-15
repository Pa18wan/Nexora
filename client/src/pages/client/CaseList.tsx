import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Briefcase, Search, Filter, Clock, MapPin,
    AlertTriangle, ChevronRight, Plus
} from 'lucide-react';
import { Button, GlassCard, UrgencyBadge, Input } from '../../components/common';
import { casesAPI } from '../../services/api';
import type { Case } from '../../types';
import './CaseList.css';

const statusColors: Record<string, string> = {
    submitted: 'info',
    analyzing: 'info',
    pending_advocate: 'warning',
    advocate_assigned: 'primary',
    in_progress: 'primary',
    on_hold: 'warning',
    resolved: 'success',
    closed: 'default',
    withdrawn: 'danger'
};

export function CaseList() {
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

    useEffect(() => {
        fetchCases();
    }, [filterStatus]);

    const fetchCases = async () => {
        setIsLoading(true);
        try {
            const params: any = { limit: 10, page: pagination.page };
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await casesAPI.getAll(params);
            if (response.data.success) {
                setCases(response.data.data.cases);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch cases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="case-list-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>My Cases</h1>
                    <p>Track and manage all your legal cases</p>
                </div>
                <Link to="/dashboard/submit-case">
                    <Button leftIcon={<Plus size={18} />}>New Case</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-buttons">
                    {['all', 'in_progress', 'pending_advocate', 'resolved'].map(status => (
                        <button
                            key={status}
                            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'all' ? 'All Cases' : status.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cases List */}
            {isLoading ? (
                <div className="loading-state">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <Briefcase size={48} />
                    <h3>No cases found</h3>
                    <p>Submit your first case to get AI-powered legal assistance</p>
                    <Link to="/dashboard/submit-case">
                        <Button>Submit Case</Button>
                    </Link>
                </GlassCard>
            ) : (
                <div className="cases-grid">
                    {filteredCases.map((caseItem) => (
                        <Link key={caseItem._id} to={`/dashboard/cases/${caseItem._id}`}>
                            <GlassCard variant="liquid" hover className="case-card">
                                <div className="case-top">
                                    <div className="case-category">{caseItem.category}</div>
                                    <UrgencyBadge level={caseItem.aiAnalysis?.urgencyLevel || 'medium'} />
                                </div>

                                <h3 className="case-title">{caseItem.title}</h3>
                                <p className="case-description">
                                    {caseItem.description.substring(0, 100)}...
                                </p>

                                <div className="case-meta">
                                    <div className="meta-item">
                                        <Clock size={14} />
                                        <span>{formatDate(caseItem.createdAt)}</span>
                                    </div>
                                    {caseItem.location && typeof caseItem.location === 'object' && caseItem.location.city && (
                                        <div className="meta-item">
                                            <MapPin size={14} />
                                            <span>{caseItem.location.city}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="case-footer">
                                    <span className={`status-badge status-${statusColors[caseItem.status]}`}>
                                        {caseItem.status.replace(/_/g, ' ')}
                                    </span>
                                    <ChevronRight size={18} className="case-arrow" />
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        Previous
                    </Button>
                    <span className="page-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
