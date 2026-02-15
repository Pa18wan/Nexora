import { Link } from 'react-router-dom';
import {
    Scale, Brain, Shield, Clock, Users, FileSearch,
    Zap, CheckCircle, ArrowRight, Star, TrendingUp,
    Lock, Globe, Award, ChevronRight, Play
} from 'lucide-react';
import { ThemeToggle } from '../../components/common';
import './LandingPage.css';

export function LandingPage() {
    const stats = [
        { value: '50,000+', label: 'Cases Resolved' },
        { value: '2,500+', label: 'Verified Advocates' },
        { value: '98%', label: 'Success Rate' },
        { value: '< 24hrs', label: 'Avg. Response Time' }
    ];

    const features = [
        {
            icon: Brain,
            title: 'AI Case Classification',
            description: 'Advanced DeepSeek AI automatically categorizes your case and detects urgency level in seconds.'
        },
        {
            icon: Users,
            title: 'Smart Advocate Matching',
            description: 'Our AI matches you with the top 5 advocates based on specialization, experience, and success rate.'
        },
        {
            icon: Zap,
            title: 'Urgency Detection',
            description: 'Critical cases are automatically flagged and prioritized for immediate attention.'
        },
        {
            icon: Shield,
            title: 'Secure Document Vault',
            description: 'Enterprise-grade encryption protects your sensitive legal documents with role-based access.'
        },
        {
            icon: Clock,
            title: 'Real-Time Tracking',
            description: 'Monitor your case progress with live updates and instant notifications at every step.'
        },
        {
            icon: FileSearch,
            title: 'AI Legal Assistant',
            description: '24/7 AI-powered guidance for your legal queries with case-aware contextual responses.'
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Submit Your Case',
            description: 'Describe your legal matter in detail. Upload relevant documents securely.',
            icon: FileSearch
        },
        {
            number: '02',
            title: 'AI Analysis',
            description: 'Our AI classifies your case, detects urgency, and generates a comprehensive report.',
            icon: Brain
        },
        {
            number: '03',
            title: 'Get Matched',
            description: 'Receive personalized recommendations for verified advocates who specialize in your case type.',
            icon: Users
        }
    ];

    const testimonials = [
        {
            name: 'Priya Sharma',
            role: 'Business Owner',
            content: 'Nexora matched me with the perfect corporate lawyer within hours. The AI analysis was spot-on.',
            rating: 5,
            avatar: 'PS'
        },
        {
            name: 'Rajesh Kumar',
            role: 'Startup Founder',
            content: 'The urgency detection feature saved my company. Critical IP issue resolved in record time.',
            rating: 5,
            avatar: 'RK'
        },
        {
            name: 'Anjali Mehta',
            role: 'Property Investor',
            content: 'Document vault and real-time tracking made managing multiple property cases effortless.',
            rating: 5,
            avatar: 'AM'
        }
    ];

    return (
        <div className="landing-page">
            {/* Animated Background */}
            <div className="landing-bg">
                <div className="landing-bg-gradient" />
                <div className="landing-bg-grid" />
                <div className="landing-bg-glow glow-1" />
                <div className="landing-bg-glow glow-2" />
                <div className="landing-bg-glow glow-3" />
                <div className="floating-shapes">
                    <div className="shape shape-1" />
                    <div className="shape shape-2" />
                    <div className="shape shape-3" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="container">
                    <Link to="/" className="nav-logo">
                        <span className="logo-text">Nexora</span>
                    </Link>

                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#testimonials">Testimonials</a>
                        <Link to="/advocates" className="nav-link-special">Find Advocates</Link>
                    </div>

                    <div className="nav-actions">
                        <ThemeToggle />
                        <Link to="/login" className="btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn-primary">
                            Get Started
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Zap size={14} />
                            <span>AI-Powered Legal Intelligence</span>
                        </div>

                        <h1 className="hero-title">
                            The Future of
                            <span className="gradient-text"> Legal Services</span>
                            <br />is Here
                        </h1>

                        <p className="hero-description">
                            Nexora uses advanced AI to classify your case, detect urgency,
                            and match you with verified advocates—all in minutes, not weeks.
                        </p>

                        <div className="hero-cta">
                            <Link to="/register" className="btn-hero-primary">
                                Submit Your Case
                                <ArrowRight size={18} />
                            </Link>
                            <button className="btn-hero-secondary">
                                <div className="play-icon">
                                    <Play size={16} />
                                </div>
                                Watch Demo
                            </button>
                        </div>

                        <div className="hero-trust">
                            <div className="trust-avatars">
                                {['PS', 'RK', 'AM', 'VN', 'SK'].map((initials, i) => (
                                    <div key={i} className="trust-avatar" style={{ '--delay': i } as React.CSSProperties}>
                                        {initials}
                                    </div>
                                ))}
                            </div>
                            <div className="trust-text">
                                <div className="trust-stars">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={14} fill="currentColor" />
                                    ))}
                                </div>
                                <span>Trusted by 50,000+ clients</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-card-stack">
                            <div className="hero-card card-1">
                                <div className="card-header">
                                    <Brain size={20} />
                                    <span>AI Analysis</span>
                                </div>
                                <div className="card-content">
                                    <div className="analysis-item">
                                        <span className="label">Category</span>
                                        <span className="value">Property Dispute</span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="label">Urgency</span>
                                        <span className="value urgency-high">High Priority</span>
                                    </div>
                                    <div className="analysis-item">
                                        <span className="label">Confidence</span>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: '94%' }} />
                                        </div>
                                        <span className="value">94%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-card card-2">
                                <div className="card-header">
                                    <Users size={20} />
                                    <span>Top Match</span>
                                </div>
                                <div className="advocate-preview">
                                    <div className="advocate-avatar">AK</div>
                                    <div className="advocate-info">
                                        <h4>Adv. Arun Kumar</h4>
                                        <p>Property Law Expert</p>
                                        <div className="advocate-stats">
                                            <span><Star size={12} fill="currentColor" /> 4.9</span>
                                            <span>•</span>
                                            <span>15 years exp.</span>
                                        </div>
                                    </div>
                                    <div className="match-score">98%</div>
                                </div>
                            </div>

                            <div className="hero-card card-3">
                                <div className="notification-pulse" />
                                <CheckCircle size={20} />
                                <span>Case Successfully Matched!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Platform Features</span>
                        <h2>Everything You Need for<br /><span className="gradient-text">Legal Success</span></h2>
                        <p>Nexora combines cutting-edge AI with verified legal expertise to deliver unmatched results.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">
                                    <feature.icon size={24} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <div className="feature-hover-line" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Simple Process</span>
                        <h2>How <span className="gradient-text">Nexora</span> Works</h2>
                        <p>Get matched with the perfect advocate in three simple steps.</p>
                    </div>

                    <div className="steps-container">
                        <div className="steps-line" />
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-number">{step.number}</div>
                                <div className="step-icon">
                                    <step.icon size={28} />
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="cta-box">
                        <div className="cta-content">
                            <h3>Ready to experience AI-powered legal services?</h3>
                            <p>Join thousands of clients who found the right advocate through Nexora.</p>
                        </div>
                        <Link to="/register" className="btn-cta">
                            Start Now — It's Free
                            <ChevronRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Client Stories</span>
                        <h2>Trusted by <span className="gradient-text">Thousands</span></h2>
                        <p>See what our clients say about their Nexora experience.</p>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="testimonial-stars">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="testimonial-content">"{testimonial.content}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{testimonial.avatar}</div>
                                    <div className="author-info">
                                        <span className="author-name">{testimonial.name}</span>
                                        <span className="author-role">{testimonial.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section">
                <div className="container">
                    <div className="trust-badges">
                        <div className="trust-badge">
                            <Lock size={24} />
                            <div>
                                <h4>Bank-Grade Security</h4>
                                <p>256-bit AES Encryption</p>
                            </div>
                        </div>
                        <div className="trust-badge">
                            <Award size={24} />
                            <div>
                                <h4>Verified Advocates</h4>
                                <p>Bar Council Certified</p>
                            </div>
                        </div>
                        <div className="trust-badge">
                            <Globe size={24} />
                            <div>
                                <h4>Pan-India Coverage</h4>
                                <p>All High Courts</p>
                            </div>
                        </div>
                        <div className="trust-badge">
                            <TrendingUp size={24} />
                            <div>
                                <h4>98% Success Rate</h4>
                                <p>Proven Results</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <Link to="/" className="footer-logo">
                                <span className="logo-text">Nexora</span>
                            </Link>
                            <p>AI-powered legal intelligence platform connecting clients with verified advocates.</p>
                            <div className="footer-social">
                                <a href="#" aria-label="Twitter">𝕏</a>
                                <a href="#" aria-label="LinkedIn">in</a>
                                <a href="#" aria-label="GitHub">⌘</a>
                            </div>
                        </div>

                        <div className="footer-links">
                            <h4>Platform</h4>
                            <Link to="/advocates">Find Advocates</Link>
                            <Link to="/register">Submit Case</Link>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How It Works</a>
                        </div>

                        <div className="footer-links">
                            <h4>Company</h4>
                            <a href="#">About Us</a>
                            <a href="#">Careers</a>
                            <a href="#">Press</a>
                            <a href="#">Contact</a>
                        </div>

                        <div className="footer-links">
                            <h4>Legal</h4>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Cookie Policy</a>
                            <a href="#">Disclaimer</a>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2024 Nexora. All rights reserved.</p>
                        <p>Made with ⚡ AI</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
