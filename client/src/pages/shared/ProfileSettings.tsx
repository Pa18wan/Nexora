import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Lock, Save, Shield, Briefcase,
    MapPin, Globe, CheckCircle, AlertTriangle
} from 'lucide-react';
import { GlassCard, Button } from '../../components/common';
import { authAPI, advocatePanelAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ProfileSettings.css';

export function ProfileSettings() {
    const { user, login } = useAuth(); // login used to refresh user state ideally, or just refetch
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [advocateData, setAdvocateData] = useState({
        bio: '',
        experienceYears: 0,
        hourlyRate: 0,
        specialization: '', // Comma separated string for input
        languages: '', // Comma separated
        isAcceptingCases: true
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });

            if (user.role === 'advocate') {
                fetchAdvocateProfile();
            }
        }
    }, [user]);

    const fetchAdvocateProfile = async () => {
        try {
            const response = await advocatePanelAPI.getDashboard(); // Usually returns profile data too
            // If getDashboard doesn't return profile, we might need a specific endpoint.
            // But let's assume it does or use getMe which returns advocateProfile
            const meResponse = await authAPI.getMe();
            if (meResponse.data.success && meResponse.data.data.advocateProfile) {
                const profile = meResponse.data.data.advocateProfile;
                setAdvocateData({
                    bio: profile.bio || '',
                    experienceYears: profile.experience || 0,
                    hourlyRate: profile.hourlyRate || 0,
                    specialization: profile.specialization?.join(', ') || '',
                    languages: profile.languages?.join(', ') || '',
                    isAcceptingCases: profile.isAcceptingCases
                });
            }
        } catch (err) {
            console.error('Failed to fetch advocate profile', err);
        }
    };

    const handleUserUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // Update Basic Info
            const userRes = await authAPI.updateProfile(formData);

            // Update Advocate Info if applicable
            if (user?.role === 'advocate') {
                const specArray = advocateData.specialization.split(',').map(s => s.trim()).filter(Boolean);
                const langArray = advocateData.languages.split(',').map(l => l.trim()).filter(Boolean);

                await advocatePanelAPI.updateProfile({
                    bio: advocateData.bio,
                    experience: advocateData.experienceYears,
                    hourlyRate: advocateData.hourlyRate,
                    specialization: specArray,
                    languages: langArray,
                    isAcceptingCases: advocateData.isAcceptingCases
                });
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' });
            // Ideally update context user here
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-settings-page">
            <div className="page-header">
                <h1>Profile Settings</h1>
                <p>Manage your personal information and preferences</p>
            </div>

            <div className="settings-grid">
                {/* Basic Info */}
                <GlassCard className="settings-card">
                    <div className="card-header">
                        <User size={20} />
                        <h2>Personal Information</h2>
                    </div>

                    <form onSubmit={handleUserUpdate}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-icon">
                                <User size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-icon">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled
                                    title="Contact support to change email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="input-icon">
                                <Phone size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {user?.role === 'advocate' && (
                            <>
                                <div className="divider"></div>
                                <div className="card-header">
                                    <Briefcase size={20} />
                                    <h2>Professional Profile</h2>
                                </div>

                                <div className="form-group">
                                    <label>Professional Bio</label>
                                    <textarea
                                        value={advocateData.bio}
                                        onChange={e => setAdvocateData({ ...advocateData, bio: e.target.value })}
                                        rows={4}
                                        placeholder="Describe your expertise and experience..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Experience (Years)</label>
                                        <input
                                            type="number"
                                            value={advocateData.experienceYears}
                                            onChange={e => setAdvocateData({ ...advocateData, experienceYears: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Hourly Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={advocateData.hourlyRate}
                                            onChange={e => setAdvocateData({ ...advocateData, hourlyRate: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Specializations (comma separated)</label>
                                    <input
                                        type="text"
                                        value={advocateData.specialization}
                                        onChange={e => setAdvocateData({ ...advocateData, specialization: e.target.value })}
                                        placeholder="Criminal Law, Family Law, etc."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Languages (comma separated)</label>
                                    <div className="input-icon">
                                        <Globe size={18} />
                                        <input
                                            type="text"
                                            value={advocateData.languages}
                                            onChange={e => setAdvocateData({ ...advocateData, languages: e.target.value })}
                                            placeholder="English, Hindi, Marathi"
                                        />
                                    </div>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={advocateData.isAcceptingCases}
                                            onChange={e => setAdvocateData({ ...advocateData, isAcceptingCases: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                        Available for new cases
                                    </label>
                                </div>
                            </>
                        )}

                        {message && (
                            <div className={`message-banner ${message.type}`}>
                                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                {message.text}
                            </div>
                        )}

                        <div className="form-actions">
                            <Button type="submit" isLoading={isLoading}>
                                <Save size={18} />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </GlassCard>

                {/* Security (Password Change Placeholder) */}
                <GlassCard className="settings-card security-card">
                    <div className="card-header">
                        <Lock size={20} />
                        <h2>Security</h2>
                    </div>
                    <p className="security-text">
                        Ensure your account is using a strong, unique password.
                    </p>
                    <Button variant="secondary" onClick={() => alert('Password change feature coming soon')}>
                        Change Password
                    </Button>
                </GlassCard>
            </div>
        </div>
    );
}
