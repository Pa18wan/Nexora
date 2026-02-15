import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff, Shield, User, Briefcase, Zap } from 'lucide-react';
import { Button, Input, GlassCard, ThemeToggle } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const loggedInUser = await login(email, password);
            // Role-based redirect
            if (loggedInUser?.role === 'admin') {
                navigate('/admin');
            } else if (loggedInUser?.role === 'advocate') {
                navigate('/advocate');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemoCredentials = (role: 'admin' | 'client' | 'advocate') => {
        const credentials = {
            admin: { email: 'admin@nexora.com', password: 'password123' },
            client: { email: 'client@nexora.com', password: 'password123' },
            advocate: { email: 'advocate@nexora.com', password: 'password123' }
        };
        setEmail(credentials[role].email);
        setPassword(credentials[role].password);
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
                <GlassCard variant="liquid" className="auth-card">
                    <div className="auth-card-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to access your legal dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}

                        <Input
                            type="email"
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail size={18} />}
                            required
                        />

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                        <div className="auth-options">
                            <label className="auth-remember">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="auth-forgot">
                                Forgot Password?
                            </Link>
                        </div>

                        <Button type="submit" fullWidth isLoading={isLoading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register">Create one</Link>
                        </p>
                    </div>

                    <div className="demo-credentials">
                        <div className="demo-title">
                            <Zap size={14} />
                            <span>Demo Credentials</span>
                        </div>
                        <div className="demo-grid">
                            <button type="button" className="demo-btn admin" onClick={() => fillDemoCredentials('admin')}>
                                <Shield size={16} />
                                <span>Admin</span>
                            </button>
                            <button type="button" className="demo-btn client" onClick={() => fillDemoCredentials('client')}>
                                <User size={16} />
                                <span>Client</span>
                            </button>
                            <button type="button" className="demo-btn advocate" onClick={() => fillDemoCredentials('advocate')}>
                                <Briefcase size={16} />
                                <span>Advocate</span>
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}
