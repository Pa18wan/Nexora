import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Shield, Star, MapPin, Globe, Award, CheckCircle,
    MessageSquare, Briefcase, ChevronLeft, Calendar
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { advocatesAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdvocateProfile.css';

interface AdvocateData {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
    };
    specialization: string[];
    experience: number;
    bio: string;
    location: {
        city: string;
        state: string;
    };
    languages: string[];
    courtPractice: string[];
    rating: number;
    reviewCount: number;
    isAcceptingCases: boolean;
    verificationStatus: string;
    hourlyRate?: number;
}

export function AdvocateProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [advocate, setAdvocate] = useState<AdvocateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHireModal, setShowHireModal] = useState(false);
    const [clientCases, setClientCases] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchAdvocateDetails();
        }
    }, [id]);

    const fetchAdvocateDetails = async () => {
        setIsLoading(true);
        try {
            const response = await advocatesAPI.getById(id!);
            if (response.data.success) {
                setAdvocate(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load advocate profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHireClick = async () => {
        if (!user || user.role !== 'client') {
            alert('Only clients can hire advocates.');
            return;
        }

        // Fetch client's cases to select from
        try {
            const response = await clientAPI.getCases({ status: 'analyzing,pending_advocate' });
            if (response.data.success) {
                setClientCases(response.data.data.cases || []);
                setShowHireModal(true);
            }
        } catch (err) {
            console.error('Failed to fetch cases:', err);
            alert('Could not load your cases. Please try again.');
        }
    };

    const confirmHire = async (caseId: string) => {
        if (!advocate) return;
        try {
            await clientAPI.hireAdvocate(caseId, advocate._id);
            alert('Advocate hired successfully! They have been notified.');
            setShowHireModal(false);
            navigate('/dashboard/cases');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to hire advocate');
        }
    };

    if (isLoading) return <div className="loading-state">Loading profile...</div>;
    if (error || !advocate) return (
        <div className="error-state">
            <User size={48} />
            <h2>Advocate Not Found</h2>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    return (
        <div className="advocate-profile-page">
            <Button variant="ghost" className="back-btn" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </Button>

            <div className="profile-header">
                <GlassCard className="profile-card-main">
                    <div className="profile-main-info">
                        <div className="profile-avatar">
                            {advocate.userId.name.charAt(0)}
                            <div className="verification-badge" title="Verified Advocate">
                                <Shield size={16} fill="var(--color-primary)" />
                            </div>
                        </div>
                        <div className="profile-details">
                            <h1>{advocate.userId.name}</h1>
                            <div className="profile-meta">
                                <div className="meta-item">
                                    <MapPin size={16} />
                                    <span>{advocate.location.city}, {advocate.location.state}</span>
                                </div>
                                <div className="meta-item">
                                    <Briefcase size={16} />
                                    <span>{advocate.experience} Years Experience</span>
                                </div>
                                <div className="meta-item rating">
                                    <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                                    <span>{advocate.rating} ({advocate.reviewCount} Reviews)</span>
                                </div>
                            </div>
                            <div className="specializations">
                                {advocate.specialization.map(spec => (
                                    <Badge key={spec} variant="primary" size="sm" rounded>{spec}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="profile-actions">
                            <Button
                                variant={advocate.isAcceptingCases ? 'primary' : 'secondary'}
                                disabled={!advocate.isAcceptingCases}
                                onClick={handleHireClick}
                                className="hire-btn"
                            >
                                {advocate.isAcceptingCases ? 'Hire Advocate' : 'Not Accepting Cases'}
                            </Button>
                            <Button variant="ghost">
                                <MessageSquare size={20} /> Message
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="profile-content-grid">
                <div className="left-col">
                    <GlassCard className="content-card">
                        <h2>About</h2>
                        <p className="bio-text">{advocate.bio || 'No bio provided.'}</p>
                    </GlassCard>

                    <GlassCard className="content-card">
                        <h2>Practice Areas & Courts</h2>
                        <div className="practice-info">
                            <div className="info-section">
                                <h3>Courts</h3>
                                <div className="tags">
                                    {advocate.courtPractice.map(court => (
                                        <span key={court} className="tag">{court}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="info-section">
                                <h3>Languages</h3>
                                <div className="tags">
                                    {advocate.languages.map(lang => (
                                        <span key={lang} className="tag">{lang}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="right-col">
                    <GlassCard className="content-card stats-card">
                        <h2>Performance</h2>
                        <div className="stat-row">
                            <div className="stat">
                                <span className="value">98%</span>
                                <span className="label">Success Rate</span>
                            </div>
                            <div className="stat">
                                <span className="value">{advocate.reviewCount}+</span>
                                <span className="label">Cases</span>
                            </div>
                            <div className="stat">
                                <span className="value">{advocate.experience}Y</span>
                                <span className="label">Exp</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="content-card">
                        <h2>Availability</h2>
                        <div className="availability-status">
                            <div className={`status-dot ${advocate.isAcceptingCases ? 'active' : 'inactive'}`}></div>
                            <span>{advocate.isAcceptingCases ? 'Available for new cases' : 'Currently unavailable'}</span>
                        </div>
                        {advocate.hourlyRate && (
                            <div className="rate-info">
                                <label>Consultation Rate</label>
                                <span className="rate">₹{advocate.hourlyRate}/- hr</span>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Hire Modal */}
            {showHireModal && (
                <div className="modal-overlay">
                    <GlassCard className="hire-modal">
                        <h2>Select a Case</h2>
                        <p>Which case would you like to hire <b>{advocate.userId.name}</b> for?</p>

                        <div className="case-selection-list">
                            {clientCases.length === 0 ? (
                                <p className="no-cases">You have no open cases suitable for hiring.</p>
                            ) : (
                                clientCases.map(c => (
                                    <div key={c._id} className="case-select-item" onClick={() => confirmHire(c._id)}>
                                        <div className="case-select-info">
                                            <span className="case-title">{c.title}</span>
                                            <span className="case-cat">{c.category}</span>
                                        </div>
                                        <Button size="sm">Select</Button>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button variant="ghost" onClick={() => setShowHireModal(false)} className="close-modal-btn">Cancel</Button>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
