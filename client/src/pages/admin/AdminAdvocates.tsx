import { useState, useEffect } from 'react';
import {
    Shield, Search, Filter, CheckCircle, XCircle,
    Eye, MapPin, Award, Briefcase, Mail
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminUserManagement.css'; // Reusing similar styles

interface Advocate {
    _id: string;
    userId: {
        name: string;
        email: string;
    };
    specialization: string[];
    experienceYears: number;
    isVerified: boolean;
    barCouncilId: string;
    location: {
        city: string;
        state: string;
    };
}

export function AdminAdvocates() {
    const [advocates, setAdvocates] = useState<Advocate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchAdvocates();
    }, [filterStatus]);

    const fetchAdvocates = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filterStatus === 'pending') params.isVerified = false;
            if (filterStatus === 'verified') params.isVerified = true;

            // Reusing getPendingAdvocates if needed, or a generic getAllAdvocates for admin
            // For now, let's assume we fetch all and filter client-side if no dedicated admin search
            const response = await adminAPI.getPendingAdvocates(); // This currently returns pending
            if (response.data.success) {
                setAdvocates(response.data.data.advocates || []);
            }
        } catch (error) {
            console.error('Failed to fetch advocates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyStatus = async (advocateId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this advocate?`)) return;

        try {
            const response = await adminAPI.verifyAdvocate(advocateId, action);
            if (response.data.success) {
                setAdvocates(prev => prev.filter(a => a._id !== advocateId));
            }
        } catch (error) {
            console.error('Failed to update advocate status:', error);
        }
    };

    const filteredAdvocates = advocates.filter(adv =>
        adv.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.barCouncilId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-users-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1>Advocate Management</h1>
                        <p>Verify bar credentials and manage advocate profiles</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" onClick={fetchAdvocates}>
                        <CheckCircle size={16} />
                        Refresh List
                    </Button>
                </div>
            </div>

            <GlassCard variant="liquid" className="controls-card">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or Bar ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="pending">Pending Verification</option>
                        <option value="verified">Verified Advocates</option>
                        <option value="all">All Advocates</option>
                    </select>
                </div>
            </GlassCard>

            {isLoading ? (
                <div className="loading-state">Loading advocates...</div>
            ) : (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Advocate</th>
                                <th>Bar ID / Exp.</th>
                                <th>Specialization</th>
                                <th>Location</th>
                                <th className="text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdvocates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-row">No advocates in this category</td>
                                </tr>
                            ) : (
                                filteredAdvocates.map((adv) => (
                                    <tr key={adv._id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-small">
                                                    {adv.userId.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-contact">
                                                    <span className="user-name">{adv.userId.name}</span>
                                                    <span className="user-email">{adv.userId.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Badge variant="info">{adv.barCouncilId}</Badge>
                                                <span className="ml-1">{adv.experienceYears}y</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="advocate-specializations">
                                                {adv.specialization.slice(0, 2).map((s, i) => (
                                                    <Badge key={i} variant="default" size="sm">{s}</Badge>
                                                ))}
                                                {adv.specialization.length > 2 && <span className="more-tag">+{adv.specialization.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <MapPin size={14} />
                                                {adv.location.city}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                {!adv.isVerified ? (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleVerifyStatus(adv._id, 'approve')}
                                                        >
                                                            <CheckCircle size={16} />
                                                            Verify
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleVerifyStatus(adv._id, 'reject')}
                                                        >
                                                            <XCircle size={16} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant="success">VERIFIED</Badge>
                                                )}
                                                <Button variant="ghost" size="sm">
                                                    <Eye size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
