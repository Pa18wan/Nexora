// Static Data for Seeding Firebase
// This separates data logic from execution logic

// 1. Initial Users
export const initialAdmin = [
    { name: 'Admin Aarav', email: 'admin@nexora.com', role: 'admin', isVerified: true, isActive: true }
];

export const initialClients = Array.from({ length: 50 }, (_, i) => ({
    name: `Client ${i + 1}`,
    email: `client${i + 1}@example.com`,
    role: 'client',
    isVerified: true,
    isActive: true
}));

export const initialAdvocates = Array.from({ length: 50 }, (_, i) => ({
    name: `Advocate ${i + 1}`,
    email: `advocate${i + 1}@example.com`,
    role: 'advocate',
    isVerified: true,
    isActive: true
}));

// 2. Advocate Profiles (Linked via email for seeding)
export const advocateProfiles = initialAdvocates.map((adv, i) => ({
    email: adv.email, // Temp linker
    barCouncilId: `BAR/MH/2024/${1000 + i}`,
    specialization: ['Criminal Law', 'Civil Law', 'Corporate Law'][i % 3],
    experienceYears: Math.floor(Math.random() * 20) + 2,
    bio: `Expert advocate in ${['Criminal', 'Civil', 'Corporate'][i % 3]} matters with ${Math.floor(Math.random() * 20) + 2} years of experience.`,
    rating: (Math.random() * 2 + 3).toFixed(1),
    totalReviews: Math.floor(Math.random() * 100),
    successRate: Math.floor(Math.random() * 30) + 70,
    totalCases: Math.floor(Math.random() * 200) + 10,
    currentCaseLoad: Math.floor(Math.random() * 5),
    isVerified: true,
    isAvailable: true,
    isActive: true,
    feeRange: { min: 5000, max: 25000 },
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    languages: ['English', 'Hindi']
}));

// 3. Cases
export const casesData = Array.from({ length: 50 }, (_, i) => ({
    title: `Legal Case #${i + 1}`,
    description: `Detailed description for case #${i + 1} regarding legal assistance required.`,
    category: ['Criminal', 'Civil', 'Property', 'Corporate'][i % 4],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    urgencyLevel: ['low', 'medium', 'high'][i % 3], // Should be lowercase 'low', 'medium', 'high' based on previous context
    status: ['submitted', 'in_progress', 'resolved'][i % 3],
    priority: 'normal',
    paymentStatus: 'pending'
}));

// 4. Notifications
export const notificationsData = Array.from({ length: 50 }, (_, i) => ({
    type: 'system',
    title: `Welcome Notification ${i + 1}`,
    message: `Welcome to Nexora platform. Notification #${i + 1}.`,
    isRead: false
}));

// 5. Complaints
export const complaintsData = Array.from({ length: 10 }, (_, i) => ({
    type: 'delay',
    subject: `Complaint #${i + 1}`,
    description: `Service delay complaint #${i + 1}`,
    status: 'submitted',
    priority: 'medium'
}));

// 6. AI Logs
export const aiLogsData = Array.from({ length: 20 }, (_, i) => ({
    type: 'chat',
    input: `Legal query #${i + 1}`,
    output: `AI response #${i + 1}`,
    model: 'deepseek-chat',
    tokensUsed: 150,
    responseTime: 1200,
    success: true
}));

// 7. Activity Logs
export const activityLogsData = Array.from({ length: 20 }, (_, i) => ({
    action: 'login',
    entityType: 'user',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0'
}));

// 8. Admin Logs
export const adminLogsData = Array.from({ length: 10 }, (_, i) => ({
    action: 'user_verify',
    targetType: 'user',
    reason: 'Routine verification',
    ipAddress: '127.0.0.1'
}));

// 9. Documents
export const documentsData = Array.from({ length: 20 }, (_, i) => ({
    filename: `document_${i + 1}.pdf`,
    originalName: `Upload_${i + 1}.pdf`,
    mimeType: 'application/pdf',
    size: 102400,
    filePath: `/uploads/docs/document_${i + 1}.pdf`,
    category: 'evidence',
    description: `Evidence document #${i + 1}`
}));

// 10. Reviews
export const reviewsData = Array.from({ length: 10 }, (_, i) => ({
    rating: 5,
    comment: `Excellent service #${i + 1}`,
    isPublic: true,
    isVerified: true
}));

// 11. System Settings
export const systemSettingsData = [
    { key: 'urgencyThreshold', value: 70, description: 'Urgency threshold', category: 'case' },
    { key: 'maxCaseLoad', value: 15, description: 'Max case load', category: 'advocate' }
];

