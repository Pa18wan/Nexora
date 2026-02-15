import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, MapPin, Star, Briefcase, Clock, Filter,
    Award, CheckCircle, MessageSquare, ChevronDown
} from 'lucide-react';
import { Button, GlassCard, Badge, Input } from '../../components/common';
import { advocatesAPI } from '../../services/api';
import type { Advocate } from '../../types';
import './AdvocateSearch.css';

// Specializations and cities will be fetched or kept as constants if simple
const cities = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'];

export function AdvocateSearch() {
    const [advocates, setAdvocates] = useState<Advocate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState('All');
    const [availableSpecializations, setAvailableSpecializations] = useState<string[]>(['All']);
    const [city, setCity] = useState('All');
    const [sortBy, setSortBy] = useState('rating');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

    useEffect(() => {
        fetchSpecializations();
    }, []);

    useEffect(() => {
        fetchAdvocates();
    }, [specialization, city, sortBy, pagination.page]);

    const fetchSpecializations = async () => {
        try {
            const response = await advocatesAPI.getSpecializations();
            if (response.data.success) {
                setAvailableSpecializations(['All', ...response.data.data]);
            }
        } catch (error) {
            console.error('Failed to fetch specializations:', error);
        }
    };

    const fetchAdvocates = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                limit: 12,
                page: pagination.page,
                sortBy,
                search: searchTerm.length >= 3 ? searchTerm : undefined
            };

            if (specialization !== 'All') params.specialization = specialization;
            if (city !== 'All') params.city = city;

            const response = await advocatesAPI.getAll(params);
            if (response.data.success) {
                setAdvocates(response.data.data.advocates);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch advocates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side search only if server-side search isn't active
    const displayAdvocates = searchTerm.length > 0 && searchTerm.length < 3
        ? advocates.filter(a =>
            (a.user?.name || a.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : advocates;

    return (
        <div className="advocate-search-page">
            <div className="page-header">
                <h1>Find Advocates</h1>
                <p>Connect with verified legal professionals specialized in your case type</p>
            </div>

            {/* Search & Filters */}
            <GlassCard variant="liquid" className="filters-card">
                <div className="search-row">
                    <div className="search-input">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or specialization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-row">
                    <div className="filter-group">
                        <label>Specialization</label>
                        <select value={specialization} onChange={(e) => {
                            setSpecialization(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}>
                            {availableSpecializations.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>City</label>
                        <select value={city} onChange={(e) => {
                            setCity(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}>
                            {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="rating">Highest Rated</option>
                            <option value="experience">Most Experienced</option>
                            <option value="cases">Most Cases</option>
                            <option value="fee">Lower Fee First</option>
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* Results */}
            {isLoading ? (
                <div className="loading-state">Loading advocates...</div>
            ) : displayAdvocates.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <Search size={48} />
                    <h3>No advocates found</h3>
                    <p>Try adjusting your search filters</p>
                </GlassCard>
            ) : (
                <div className="advocates-grid">
                    {displayAdvocates.map((advocate) => (
                        <GlassCard key={advocate._id} variant="liquid" hover className="advocate-card">
                            <div className="advocate-header">
                                <div className="advocate-avatar">
                                    {(advocate.user?.name || advocate.userName || 'A').charAt(0)}
                                </div>
                                <div className="advocate-info">
                                    <h3>{advocate.user?.name || advocate.userName || 'Advocate'}</h3>
                                    <div className="advocate-location">
                                        <MapPin size={14} />
                                        <span>{advocate.officeAddress?.city || advocate.location?.city || 'India'}, {advocate.officeAddress?.state || advocate.location?.state || ''}</span>
                                    </div>
                                </div>
                                {(advocate.verificationStatus === 'verified' || advocate.isVerified) && (
                                    <CheckCircle size={20} className="verified-badge" />
                                )}
                            </div>

                            <div className="advocate-specs">
                                {advocate.specialization.slice(0, 3).map((spec, i) => (
                                    <Badge key={i} variant="primary" size="sm">{spec}</Badge>
                                ))}
                                {advocate.specialization.length > 3 && (
                                    <Badge variant="default" size="sm">+{advocate.specialization.length - 3}</Badge>
                                )}
                            </div>

                            <div className="advocate-stats">
                                <div className="stat">
                                    <Star size={16} className="stat-icon star" />
                                    <span>{advocate.rating?.toFixed(1) || 'N/A'}</span>
                                    <small>({advocate.totalReviews} reviews)</small>
                                </div>
                                <div className="stat">
                                    <Briefcase size={16} className="stat-icon" />
                                    <span>{advocate.totalCases}+ cases</span>
                                </div>
                                <div className="stat">
                                    <Clock size={16} className="stat-icon" />
                                    <span>{advocate.experienceYears} years</span>
                                </div>
                            </div>

                            <div className="advocate-success">
                                <div className="success-bar">
                                    <div
                                        className="success-fill"
                                        style={{ width: `${advocate.successRate || 0}%` }}
                                    />
                                </div>
                                <span>{advocate.successRate || 0}% Success Rate</span>
                            </div>

                            <div className="advocate-footer">
                                <div className="fee-info">
                                    <span className="fee-label">Consultation</span>
                                    <span className="fee-value">₹{advocate.consultationFee || advocate.feeRange?.min || 'N/A'}</span>
                                </div>
                                <Link to={`/dashboard/advocates/${advocate._id}`}>
                                    <Button size="sm">View Profile</Button>
                                </Link>
                            </div>
                        </GlassCard>
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
