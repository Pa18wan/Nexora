import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, User, Phone, Eye, EyeOff, Briefcase, Award } from 'lucide-react';
import { Button, Input, GlassCard, ThemeToggle } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'client' as 'client' | 'advocate',
        barCouncilId: '',
        experienceYears: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role: 'client' | 'advocate') => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.role === 'advocate' && !formData.barCouncilId) {
            setError('Bar Council ID is required for advocates');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                phone: formData.phone,
                barCouncilId: formData.barCouncilId || undefined,
                experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-glow auth-bg-glow-1" />
                <div className="auth-bg-glow auth-bg-glow-2" />
            </div>

            <header className="auth-header">
                <Link to="/" className="auth-logo">
                    <span>Nexora</span>
                </Link>
                <ThemeToggle />
            </header>

            <main className="auth-main">
                <GlassCard variant="liquid" className="auth-card auth-card-register">
                    <div className="auth-card-header">
                        <h1>Create Account</h1>
                        <p>Join Nexora and get started</p>
                    </div>

                    {/* Role Selection */}
                    <div className="role-selector">
                        <button
                            type="button"
                            className={`role-option ${formData.role === 'client' ? 'active' : ''}`}
                            onClick={() => handleRoleSelect('client')}
                        >
                            <div className="role-icon">
                                <User size={20} />
                            </div>
                            <div className="role-info">
                                <span className="role-title">Client</span>
                                <span className="role-desc">Submit cases & find advocates</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`role-option ${formData.role === 'advocate' ? 'active' : ''}`}
                            onClick={() => handleRoleSelect('advocate')}
                        >
                            <div className="role-icon">
                                <Briefcase size={20} />
                            </div>
                            <div className="role-info">
                                <span className="role-title">Advocate</span>
                                <span className="role-desc">Accept cases & grow practice</span>
                            </div>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}

                        <div className="form-grid">
                            <Input
                                type="text"
                                name="name"
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                leftIcon={<User size={18} />}
                                required
                            />

                            <Input
                                type="tel"
                                name="phone"
                                label="Phone"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                leftIcon={<Phone size={18} />}
                            />
                        </div>

                        <Input
                            type="email"
                            name="email"
                            label="Email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            leftIcon={<Mail size={18} />}
                            required
                        />

                        <div className="form-grid">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                label="Password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                leftIcon={<Lock size={18} />}
                                rightIcon={
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                                required
                            />

                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                label="Confirm Password"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                leftIcon={<Lock size={18} />}
                                required
                            />
                        </div>

                        {formData.role === 'advocate' && (
                            <div className="advocate-fields">
                                <div className="form-grid">
                                    <Input
                                        type="text"
                                        name="barCouncilId"
                                        label="Bar Council ID"
                                        placeholder="e.g., DL/123/2020"
                                        value={formData.barCouncilId}
                                        onChange={handleChange}
                                        leftIcon={<Award size={18} />}
                                        required
                                    />

                                    <Input
                                        type="number"
                                        name="experienceYears"
                                        label="Years of Experience"
                                        placeholder="e.g., 5"
                                        value={formData.experienceYears}
                                        onChange={handleChange}
                                        leftIcon={<Briefcase size={18} />}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="auth-terms">
                            <label>
                                <input type="checkbox" required />
                                <span>
                                    I agree to the{' '}
                                    <a href="#" target="_blank">Terms of Service</a>{' '}
                                    and{' '}
                                    <a href="#" target="_blank">Privacy Policy</a>
                                </span>
                            </label>
                        </div>

                        <Button type="submit" fullWidth isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}
