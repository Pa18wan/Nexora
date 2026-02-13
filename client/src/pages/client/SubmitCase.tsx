import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, MapPin, Upload, Brain, Zap, AlertTriangle,
    CheckCircle, ArrowRight, ArrowLeft, X, File, Loader
} from 'lucide-react';
import { GlassCard, Button, Input } from '../../components/common';
import { clientAPI } from '../../services/api';
import './SubmitCase.css';

interface AIAnalysis {
    category: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    urgencyScore: number;
    urgencyDetails: {
        reasoning: string;
        suggestedActions: string[];
    };
    suggestedCategory?: string;
    estimatedComplexity?: string;
}

interface FormData {
    title: string;
    description: string;
    location: string;
    category: string;
    documents: File[];
}

const CATEGORIES = [
    'Property', 'Corporate', 'Criminal', 'Family', 'Labour',
    'Consumer', 'Civil', 'Tax', 'Intellectual Property', 'Other'
];

const LOCATIONS = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Other'
];

export function SubmitCase() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [caseId, setCaseId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        location: '',
        category: '',
        documents: []
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFormData({ ...formData, documents: [...formData.documents, ...newFiles] });
        }
    };

    const removeFile = (index: number) => {
        const newFiles = formData.documents.filter((_, i) => i !== index);
        setFormData({ ...formData, documents: newFiles });
    };

    const analyzeWithAI = async () => {
        setIsAnalyzing(true);
        try {
            const submitData = {
                title: formData.title,
                description: formData.description,
                category: formData.category || undefined,
                location: { city: formData.location }
            };

            const response = await clientAPI.submitCase(submitData);
            if (response.data.success) {
                const result = response.data.data;
                setCaseId(result.case._id);
                setAiAnalysis(result.aiAnalysis);
                setStep(2);
            }
        } catch (error: any) {
            console.error('Failed to analyze/submit case:', error);
            const errorMessage = error.response?.data?.error || 'Failed to analyze case. Please try again.';
            alert(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = () => {
        // Since the case is already submitted during Step 1 (for AI analysis),
        // we just proceed to recommendations.
        navigate('/dashboard/recommendations', {
            state: {
                caseId,
                caseData: formData,
                aiAnalysis
            }
        });
    };

    const getUrgencyColor = (level: string) => {
        const colors: Record<string, string> = {
            critical: 'var(--urgency-critical)',
            high: 'var(--urgency-high)',
            medium: 'var(--urgency-medium)',
            low: 'var(--urgency-low)'
        };
        return colors[level] || 'var(--text-muted)';
    };

    const isStep1Valid = formData.title.length >= 10 && formData.description.length >= 100 && formData.location;

    return (
        <div className="submit-case-page">
            {/* Progress Indicator */}
            <div className="progress-indicator">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-circle">
                        {step > 1 ? <CheckCircle size={18} /> : '1'}
                    </div>
                    <span>Case Details</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-circle">
                        {step > 2 ? <CheckCircle size={18} /> : '2'}
                    </div>
                    <span>AI Analysis</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <span>Get Matched</span>
                </div>
            </div>

            {/* Step 1: Case Details */}
            {step === 1 && (
                <GlassCard variant="liquid" className="case-form-card">
                    <div className="form-header">
                        <div className="form-icon">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1>Submit Your Case</h1>
                            <p>Describe your legal matter in detail. Our AI will analyze and match you with the best advocates.</p>
                        </div>
                    </div>

                    <form className="case-form">
                        <div className="form-group">
                            <label htmlFor="title">Case Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                placeholder="e.g., Property Dispute - Land Registration Issue"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="form-input"
                            />
                            <span className="input-hint">Minimum 10 characters</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Case Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Describe your legal matter in detail. Include relevant dates, parties involved, and what outcome you're seeking..."
                                value={formData.description}
                                onChange={handleInputChange}
                                className="form-textarea"
                                rows={6}
                            />
                            <div className="textarea-footer">
                                <span className="input-hint">Minimum 100 characters for accurate AI analysis</span>
                                <span className={`char-count ${formData.description.length >= 100 ? 'valid' : ''}`}>
                                    {formData.description.length}/100
                                </span>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <select
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="">Select Location</option>
                                    {LOCATIONS.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="category">Category (Optional)</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="">AI will detect</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Upload Documents (Optional)</label>
                            <div className="file-upload-area">
                                <input
                                    type="file"
                                    id="documents"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="file-input"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <label htmlFor="documents" className="file-upload-label">
                                    <Upload size={24} />
                                    <span>Drop files here or click to upload</span>
                                    <span className="file-hint">PDF, DOC, DOCX, JPG, PNG up to 10MB each</span>
                                </label>
                            </div>

                            {formData.documents.length > 0 && (
                                <div className="uploaded-files">
                                    {formData.documents.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <File size={16} />
                                            <span>{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="remove-file"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <Button
                                type="button"
                                onClick={analyzeWithAI}
                                disabled={!isStep1Valid}
                                isLoading={isAnalyzing}
                                className="analyze-btn"
                            >
                                <Brain size={18} />
                                Analyze with AI
                                <ArrowRight size={18} />
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            )}

            {/* AI Analyzing Animation */}
            {isAnalyzing && (
                <GlassCard className="analyzing-card">
                    <div className="analyzing-animation">
                        <div className="brain-pulse">
                            <Brain size={48} />
                        </div>
                        <div className="analyzing-text">
                            <h2>AI Analyzing Your Case</h2>
                            <p>Our DeepSeek AI is classifying your case, detecting urgency, and preparing recommendations...</p>
                        </div>
                        <div className="analyzing-steps">
                            <div className="analyzing-step active">
                                <CheckCircle size={16} />
                                <span>Reading case description</span>
                            </div>
                            <div className="analyzing-step active">
                                <Loader size={16} className="spinner" />
                                <span>Classifying case category</span>
                            </div>
                            <div className="analyzing-step">
                                <span className="step-dot" />
                                <span>Detecting urgency level</span>
                            </div>
                            <div className="analyzing-step">
                                <span className="step-dot" />
                                <span>Calculating risk score</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Step 2: AI Analysis Results */}
            {step === 2 && aiAnalysis && (
                <div className="analysis-results">
                    <GlassCard variant="liquid" className="analysis-card">
                        <div className="analysis-header">
                            <div className="analysis-icon">
                                <Brain size={28} />
                            </div>
                            <div>
                                <h1>AI Analysis Complete</h1>
                                <p>Review the analysis and proceed to get matched with advocates</p>
                            </div>
                        </div>

                        <div className="analysis-grid">
                            <div className="analysis-item">
                                <span className="analysis-label">Category Detected</span>
                                <span className="analysis-value">{aiAnalysis.category}</span>
                            </div>

                            <div className="analysis-item urgency">
                                <span className="analysis-label">Urgency Level</span>
                                <span
                                    className="analysis-value urgency-badge"
                                    style={{ color: getUrgencyColor(aiAnalysis.urgencyLevel) }}
                                >
                                    <AlertTriangle size={16} />
                                    {aiAnalysis.urgencyLevel.toUpperCase()}
                                </span>
                            </div>

                            <div className="analysis-item">
                                <span className="analysis-label">Urgency Score</span>
                                <div className="risk-score">
                                    <div className="risk-bar">
                                        <div
                                            className="risk-fill"
                                            style={{
                                                width: `${aiAnalysis.urgencyScore}%`,
                                                background: `linear-gradient(90deg, var(--color-success), ${getUrgencyColor(aiAnalysis.urgencyLevel)})`
                                            }}
                                        />
                                    </div>
                                    <span className="risk-value">{aiAnalysis.urgencyScore}%</span>
                                </div>
                            </div>

                            <div className="analysis-item">
                                <span className="analysis-label">Complexity</span>
                                <span className="analysis-value">{aiAnalysis.estimatedComplexity}</span>
                            </div>
                        </div>

                        <div className="analysis-reasoning">
                            <h3><Zap size={18} /> AI Reasoning</h3>
                            <p>{aiAnalysis.urgencyDetails?.reasoning || 'Case analyzed based on provided description.'}</p>
                        </div>

                        {aiAnalysis.urgencyDetails?.suggestedActions && (
                            <div className="suggested-actions">
                                <h3><CheckCircle size={18} /> Suggested Actions</h3>
                                <ul>
                                    {aiAnalysis.urgencyDetails.suggestedActions.map((action, index) => (
                                        <li key={index}>
                                            <CheckCircle size={14} />
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="analysis-actions">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(1)}
                            >
                                <ArrowLeft size={18} />
                                Edit Case
                            </Button>
                            <Button
                                onClick={handleSubmit}
                            >
                                Find Matching Advocates
                                <ArrowRight size={18} />
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
