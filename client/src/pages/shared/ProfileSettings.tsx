import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Lock, Save, Eye, EyeOff,
    Shield, CheckCircle, Camera, Edit3, Key, AlertCircle
} from 'lucide-react';
import { GlassCard, Button, Input, Badge } from '../../components/common';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ProfileSettings.css';

export function ProfileSettings() {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState((user as any)?.phone || '');
    const [bio, setBio] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        // Load full profile data
        const loadProfile = async () => {
            try {
                const res = await authAPI.getMe();
                if (res.data.success) {
                    const u = res.data.data.user;
                    setName(u.name || '');
                    setEmail(u.email || '');
                    setPhone(u.phone || '');
                    setBio(u.bio || '');
                }
            } catch (err) {
                console.error('Failed to load profile', err);
            }
        };
        loadProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);

        try {
            const res = await authAPI.updateProfile({ name, email, phone, bio });
            if (res.data.success) {
                updateUser(res.data.data.user);
                setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (err: any) {
            setProfileMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await authAPI.changePassword({ currentPassword, newPassword });
            if (res.data.success) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            setPasswordMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    const avatarUrl = (user as any)?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=120`;

    return (
        <div className="profile-settings-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <User size={24} />
                    </div>
                    <div>
                        <h1>Profile Settings</h1>
                        <p>Manage your account information and security</p>
                    </div>
                </div>
            </div>

            <div className="profile-layout">
                {/* Profile Card */}
                <GlassCard variant="liquid" className="profile-card">
                    <div className="profile-avatar-section">
                        <div className="avatar-container">
                            <img src={avatarUrl} alt={user?.name} className="profile-avatar" />
                            <div className="avatar-overlay">
                                <Camera size={20} />
                            </div>
                        </div>
                        <h2>{user?.name}</h2>
                        <p className="profile-email">{user?.email}</p>
                        <Badge variant={user?.role === 'admin' ? 'danger' : user?.role === 'advocate' ? 'primary' : 'success'}>
                            {user?.role?.toUpperCase()}
                        </Badge>
                        {user?.isVerified && (
                            <div className="verified-status">
                                <CheckCircle size={14} />
                                <span>Verified Account</span>
                            </div>
                        )}
                    </div>

                    <div className="profile-nav">
                        <button
                            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <Edit3 size={18} />
                            <span>Personal Info</span>
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Key size={18} />
                            <span>Security</span>
                        </button>
                    </div>
                </GlassCard>

                {/* Content Area */}
                <div className="settings-content">
                    {activeTab === 'profile' ? (
                        <GlassCard variant="liquid" className="settings-card">
                            <div className="card-header">
                                <h2>Personal Information</h2>
                                <p>Update your personal details</p>
                            </div>

                            {profileMessage && (
                                <div className={`message-banner ${profileMessage.type}`}>
                                    {profileMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <span>{profileMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handleProfileUpdate} className="settings-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-with-icon">
                                            <User size={18} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-with-icon">
                                            <Mail size={18} />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <div className="input-with-icon">
                                            <Phone size={18} />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <div className="input-with-icon readonly">
                                            <Shield size={18} />
                                            <input
                                                type="text"
                                                value={user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || '')}
                                                readOnly
                                                className="readonly-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-actions">
                                    <Button type="submit" isLoading={profileLoading}>
                                        <Save size={18} />
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    ) : (
                        <GlassCard variant="liquid" className="settings-card">
                            <div className="card-header">
                                <h2>Change Password</h2>
                                <p>Update your account password</p>
                            </div>

                            {passwordMessage && (
                                <div className={`message-banner ${passwordMessage.type}`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <span>{passwordMessage.text}</span>
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="settings-form">
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="password-requirements">
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li className={newPassword.length >= 6 ? 'met' : ''}>
                                            <CheckCircle size={14} />
                                            At least 6 characters
                                        </li>
                                        <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                                            <CheckCircle size={14} />
                                            One uppercase letter
                                        </li>
                                        <li className={/[0-9]/.test(newPassword) ? 'met' : ''}>
                                            <CheckCircle size={14} />
                                            One number
                                        </li>
                                        <li className={newPassword === confirmPassword && newPassword.length > 0 ? 'met' : ''}>
                                            <CheckCircle size={14} />
                                            Passwords match
                                        </li>
                                    </ul>
                                </div>

                                <div className="form-actions">
                                    <Button type="submit" isLoading={passwordLoading}>
                                        <Key size={18} />
                                        Change Password
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
}
