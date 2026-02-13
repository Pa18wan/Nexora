// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'client' | 'advocate' | 'admin';
    avatar?: string;
    isVerified: boolean;
    phone?: string;
}

// Advocate Types
export interface Advocate {
    _id: string;
    userId: User;
    barCouncilId: string;
    specialization: string[];
    experienceYears: number;
    education: { degree: string; institution: string; year: number }[];
    certifications: { name: string; issuedBy: string; year: number }[];
    courtsPracticed: string[];
    languages: string[];
    successRate: number;
    totalCases: number;
    casesWon: number;
    rating: number;
    totalReviews: number;
    consultationFee: number;
    availability: Record<string, { start: string; end: string; available: boolean }>;
    officeAddress: {
        street?: string;
        city: string;
        state: string;
        pincode?: string;
        country: string;
    };
    verificationStatus: 'pending' | 'verified' | 'rejected';
    isProfileComplete: boolean;
    isAcceptingCases: boolean;
    bio?: string;
}

// Case Types
export interface AIAnalysis {
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    caseType: string;
    requiredSpecialization: string[];
    estimatedDuration: string;
    keyIssues: string[];
    recommendedActions: string[];
    reasoning: string;
    analyzedAt: string;
}

export interface TimelineEvent {
    event: string;
    description?: string;
    date: string;
    createdBy?: User;
}

export interface RecommendedAdvocate {
    advocateId: Advocate;
    matchScore: number;
    reason: string;
    recommendedAt: string;
}

export interface Case {
    _id: string;
    clientId: User;
    advocateId?: Advocate;
    caseNumber: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    location: {
        city: string;
        state: string;
        country: string;
    };
    aiAnalysis: AIAnalysis;
    status: 'submitted' | 'analyzing' | 'pending_advocate' | 'advocate_assigned' |
    'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'withdrawn';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timeline: TimelineEvent[];
    nextHearingDate?: string;
    filingDate?: string;
    closedDate?: string;
    clientNotes?: string;
    recommendedAdvocates: RecommendedAdvocate[];
    estimatedCost?: number;
    actualCost?: number;
    paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
    createdAt: string;
    updatedAt: string;
}

// Notification Types
export interface Notification {
    _id: string;
    userId: string;
    type: 'case_update' | 'document_uploaded' | 'advocate_assigned' |
    'hearing_reminder' | 'payment_due' | 'message_received' |
    'case_resolved' | 'urgent_alert' | 'system' | 'ai_recommendation';
    title: string;
    message: string;
    relatedCase?: Case;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        items: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

// Dashboard Stats
export interface ClientDashboardStats {
    activeCases: number;
    urgentCases: number;
    pendingDocuments: number;
    totalCases: number;
}

export interface AdvocateDashboardStats {
    activeCases: number;
    urgentCases: number;
    pendingRequests: number;
    resolvedCases: number;
    totalCases: number;
    successRate: number;
    rating: number;
    totalReviews: number;
}

export interface AdminDashboardStats {
    users: {
        total: number;
        advocates: number;
        verified: number;
        pending: number;
    };
    cases: {
        total: number;
        active: number;
        resolved: number;
        urgent: number;
    };
    complaints: {
        total: number;
        pending: number;
    };
    ai: {
        total: number;
        today: number;
    };
    categoryDistribution: { _id: string; count: number }[];
    urgencyDistribution: { _id: string; count: number }[];
}
