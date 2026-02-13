import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Brain, Star, MapPin, Briefcase, Clock, CheckCircle,
    ArrowRight, ChevronDown, Shield, Award, TrendingUp
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { clientAPI } from '../../services/api';
import './AdvocateRecommendations.css';

interface Advocate {
    id: string;
    name: string;
    avatar?: string;
    specialization: string[];
    location: any;
    experienceYears: number;
    rating: number;
    totalCases: number;
    successRate: number;
    matchScore: number;
    responseTime?: string;
    feeRange?: string;
    isVerified?: boolean;
    matchReasons: string[];
}

export function AdvocateRecommendations() {
    const location = useLocation();
    const navigate = useNavigate();
    const [advocates, setAdvocates] = useState<Advocate[]>([]);
    const [caseId, setCaseId] = useState<string | null>(location.state?.caseId || null);
    const [selectedAdvocate, setSelectedAdvocate] = useState<string | null>(null);
    const [showAllReasons, setShowAllReasons] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isHiring, setIsHiring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (caseId) {
            fetchRecommendations();
        } else {
            setIsLoading(false);
            setError('No case ID provided for recommendations.');
        }
    }, [caseId]);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const response = await clientAPI.getRecommendations(caseId!);
            if (response.data.success) {
                const recommendations = response.data.data.recommendations.map((rec: any) => ({
                    id: rec.advocate.id,
                    name: rec.advocate.name,
                    specialization: rec.advocate.specialization,
                    location: rec.advocate.location?.city || 'India',
                    experienceYears: rec.advocate.experienceYears,
                    rating: rec.advocate.rating,
                    totalCases: rec.advocate.totalCases || 0,
                    successRate: rec.advocate.successRate || 0,
                    matchScore: rec.matchScore,
                    matchReasons: rec.matchReasons,
                    isVerified: true, // Defaulting to true for recommended advocates
                    responseTime: '< 4 hours', // Mocking response time as it's not in schema yet
                    feeRange: rec.advocate.feeRange || 'Consultation fee applies'
                }));
                setAdvocates(recommendations);
            }
        } catch (err: any) {
            console.error('Failed to fetch recommendations:', err);
            setError(err.response?.data?.error || 'Failed to load recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHire = async (advocateId: string) => {
        if (!caseId) return;
        setIsHiring(true);
        setSelectedAdvocate(advocateId);

        try {
            const response = await clientAPI.hireAdvocate(caseId, advocateId);
            if (response.data.success) {
                // Navigate to case list or success page
                navigate('/dashboard/cases', {
                    state: { hired: true, advocateId }
                });
            }
        } catch (err: any) {
            console.error('Failed to hire advocate:', err);
            alert(err.response?.data?.error || 'Failed to hire advocate. Please try again.');
        } finally {
            setIsHiring(false);
        }
    };

    const toggleReasons = (advocateId: string) => {
        setShowAllReasons(prev => ({
            ...prev,
            [advocateId]: !prev[advocateId]
        }));
    };

    const getMatchScoreColor = (score: number) => {
        if (score >= 90) return 'var(--color-success)';
        if (score >= 75) return 'var(--color-primary)';
        if (score >= 60) return 'var(--color-warning)';
        return 'var(--text-muted)';
    };

    if (error) {
        return (
            <div className="recommendations-page">
                <GlassCard className="error-card">
                    <div className="error-content">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <Button onClick={() => navigate('/dashboard/submit-case')}>Go Back</Button>
                    </div>
                </GlassCard>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="recommendations-page">
                <GlassCard className="loading-card">
                    <div className="loading-animation">
                        <div className="brain-pulse">
                            <Brain size={48} />
                        </div>
                        <h2>Finding Your Perfect Match</h2>
                        <p>Our AI is ranking advocates based on your case requirements...</p>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="recommendations-page">
            <div className="recommendations-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Brain size={28} />
                    </div>
                    <div>
                        <h1>AI Recommended Advocates</h1>
                        <p>Top {advocates.length} matches based on your case analysis</p>
                    </div>
                </div>
                <div className="header-badge">
                    <Shield size={16} />
                    All advocates are verified
                </div>
            </div>

            <div className="advocates-list">
                {advocates.map((advocate, index) => (
                    <GlassCard
                        key={advocate.id}
                        className={`advocate-card ${selectedAdvocate === advocate.id ? 'selected' : ''}`}
                    >
                        {index === 0 && (
                            <div className="top-match-badge">
                                <Award size={14} />
                                Best Match
                            </div>
                        )}

                        <div className="advocate-header">
                            <div className="advocate-avatar">
                                {advocate.name.split(' ').slice(1).map(n => n[0]).join('')}
                            </div>
                            <div className="advocate-info">
                                <div className="advocate-name-row">
                                    <h2>{advocate.name}</h2>
                                    {advocate.isVerified && (
                                        <span className="verified-badge">
                                            <CheckCircle size={14} />
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <div className="advocate-specs">
                                    {advocate.specialization.slice(0, 3).map((spec, i) => (
                                        <Badge key={i} variant="default">{spec}</Badge>
                                    ))}
                                </div>
                                <div className="advocate-meta">
                                    <span><MapPin size={14} /> {advocate.location}</span>
                                    <span><Briefcase size={14} /> {advocate.experienceYears} years</span>
                                    <span><Clock size={14} /> {advocate.responseTime}</span>
                                </div>
                            </div>
                            <div className="match-score-circle" style={{ '--score-color': getMatchScoreColor(advocate.matchScore) } as React.CSSProperties}>
                                <svg viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="var(--bg-tertiary)"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="var(--score-color)"
                                        strokeWidth="3"
                                        strokeDasharray={`${advocate.matchScore}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="score-text">
                                    <span className="score-value">{advocate.matchScore}%</span>
                                    <span className="score-label">Match</span>
                                </div>
                            </div>
                        </div>

                        <div className="advocate-stats">
                            <div className="stat">
                                <Star size={16} fill="currentColor" />
                                <span className="stat-value">{advocate.rating}</span>
                                <span className="stat-label">Rating</span>
                            </div>
                            <div className="stat">
                                <Briefcase size={16} />
                                <span className="stat-value">{advocate.totalCases}</span>
                                <span className="stat-label">Cases</span>
                            </div>
                            <div className="stat">
                                <TrendingUp size={16} />
                                <span className="stat-value">{advocate.successRate}%</span>
                                <span className="stat-label">Success</span>
                            </div>
                            <div className="stat fee">
                                <span className="stat-value">{advocate.feeRange}</span>
                                <span className="stat-label">Fee Range</span>
                            </div>
                        </div>

                        <div className="match-reasons">
                            <h3>Why this match:</h3>
                            <ul>
                                {(showAllReasons[advocate.id]
                                    ? advocate.matchReasons
                                    : advocate.matchReasons.slice(0, 2)
                                ).map((reason, i) => (
                                    <li key={i}>
                                        <CheckCircle size={14} />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                            {advocate.matchReasons.length > 2 && (
                                <button
                                    className="show-more-btn"
                                    onClick={() => toggleReasons(advocate.id)}
                                >
                                    {showAllReasons[advocate.id] ? 'Show less' : `+${advocate.matchReasons.length - 2} more reasons`}
                                    <ChevronDown size={14} className={showAllReasons[advocate.id] ? 'rotated' : ''} />
                                </button>
                            )}
                        </div>

                        <div className="advocate-actions">
                            <Button variant="ghost">
                                View Profile
                            </Button>
                            <Button
                                onClick={() => handleHire(advocate.id)}
                                isLoading={isHiring && selectedAdvocate === advocate.id}
                            >
                                Hire Advocate
                                <ArrowRight size={16} />
                            </Button>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
