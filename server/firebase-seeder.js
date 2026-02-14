import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://user-db.firebaseio.com';

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
            databaseURL
        });
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            }),
            databaseURL
        });
    } else {
        console.error('❌ No Firebase credentials provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or individual env vars.');
        process.exit(1);
    }
}

const db = admin.firestore();
const generateId = () => db.collection('_temp').doc().id;

async function seed() {
    console.log('🌱 Starting Firebase Seeder...\n');

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const now = new Date().toISOString();

    // ========== USERS ==========
    const users = [
        {
            id: generateId(),
            data: {
                name: 'Admin User',
                email: 'admin@nexora.com',
                password: hashedPassword,
                role: 'admin',
                phone: '+91-9876543210',
                avatar: null,
                isVerified: true,
                isActive: true,
                lastLogin: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Rahul Sharma',
                email: 'client@nexora.com',
                password: hashedPassword,
                role: 'client',
                phone: '+91-9876543211',
                avatar: null,
                isVerified: true,
                isActive: true,
                lastLogin: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Priya Patel',
                email: 'client2@nexora.com',
                password: hashedPassword,
                role: 'client',
                phone: '+91-9876543212',
                avatar: null,
                isVerified: true,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Amit Kumar',
                email: 'client3@nexora.com',
                password: hashedPassword,
                role: 'client',
                phone: '+91-9876543213',
                avatar: null,
                isVerified: true,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Adv. Sunita Reddy',
                email: 'advocate@nexora.com',
                password: hashedPassword,
                role: 'advocate',
                phone: '+91-9876543214',
                avatar: null,
                isVerified: true,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Adv. Vikram Singh',
                email: 'advocate2@nexora.com',
                password: hashedPassword,
                role: 'advocate',
                phone: '+91-9876543215',
                avatar: null,
                isVerified: true,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Adv. Meera Joshi',
                email: 'advocate3@nexora.com',
                password: hashedPassword,
                role: 'advocate',
                phone: '+91-9876543216',
                avatar: null,
                isVerified: true,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                name: 'Adv. Rajesh Gupta',
                email: 'advocate4@nexora.com',
                password: hashedPassword,
                role: 'advocate',
                phone: '+91-9876543217',
                avatar: null,
                isVerified: false,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        }
    ];

    console.log('👤 Creating users...');
    for (const user of users) {
        await db.collection('users').doc(user.id).set(user.data);
        console.log(`   ✅ ${user.data.name} (${user.data.email})`);
    }

    const adminUser = users[0];
    const client1 = users[1];
    const client2 = users[2];
    const client3 = users[3];
    const advUser1 = users[4];
    const advUser2 = users[5];
    const advUser3 = users[6];
    const advUser4 = users[7];

    // ========== ADVOCATES ==========
    const advocates = [
        {
            id: generateId(),
            data: {
                userId: advUser1.id,
                barCouncilId: 'MH/1234/2015',
                specialization: ['Criminal Law', 'Civil Law', 'Constitutional Law'],
                experienceYears: 12,
                bio: 'Experienced criminal and civil lawyer with expertise in constitutional matters. Former public prosecutor with a strong track record.',
                rating: 4.8,
                totalReviews: 125,
                successRate: 87,
                totalCases: 340,
                currentCaseLoad: 3,
                isVerified: true,
                isActive: true,
                isAvailable: true,
                isAcceptingCases: true,
                feeRange: { min: 5000, max: 50000 },
                location: { city: 'Mumbai', state: 'Maharashtra' },
                officeAddress: { city: 'Mumbai', state: 'Maharashtra', address: '45 Law Chambers, Fort Area' },
                languages: ['English', 'Hindi', 'Marathi'],
                education: [{ degree: 'LLB', university: 'Mumbai University', year: 2011 }, { degree: 'LLM', university: 'NLU Mumbai', year: 2013 }],
                awards: ['Best Criminal Lawyer 2022 - Maharashtra Bar Council'],
                consultationFee: 2000,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                userId: advUser2.id,
                barCouncilId: 'DL/5678/2012',
                specialization: ['Property Law', 'Corporate Law', 'Tax Law'],
                experienceYears: 15,
                bio: 'Senior property and corporate law specialist. Handled landmark property dispute cases in Delhi NCR.',
                rating: 4.6,
                totalReviews: 98,
                successRate: 82,
                totalCases: 290,
                currentCaseLoad: 5,
                isVerified: true,
                isActive: true,
                isAvailable: true,
                isAcceptingCases: true,
                feeRange: { min: 10000, max: 100000 },
                location: { city: 'Delhi', state: 'Delhi' },
                officeAddress: { city: 'New Delhi', state: 'Delhi', address: '12 Tis Hazari Court Complex' },
                languages: ['English', 'Hindi', 'Punjabi'],
                education: [{ degree: 'BA LLB', university: 'Delhi University', year: 2008 }, { degree: 'LLM', university: 'NLU Delhi', year: 2010 }],
                awards: [],
                consultationFee: 3000,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                userId: advUser3.id,
                barCouncilId: 'KA/9101/2018',
                specialization: ['Family Law', 'Consumer Law', 'Human Rights'],
                experienceYears: 8,
                bio: 'Passionate family and consumer law advocate. Dedicated to protecting individual rights and family welfare.',
                rating: 4.9,
                totalReviews: 67,
                successRate: 91,
                totalCases: 150,
                currentCaseLoad: 2,
                isVerified: true,
                isActive: true,
                isAvailable: true,
                isAcceptingCases: true,
                feeRange: { min: 3000, max: 30000 },
                location: { city: 'Bangalore', state: 'Karnataka' },
                officeAddress: { city: 'Bangalore', state: 'Karnataka', address: '78 MG Road, Legal Centre' },
                languages: ['English', 'Hindi', 'Kannada'],
                education: [{ degree: 'BA LLB', university: 'NLSIU Bangalore', year: 2015 }],
                awards: ['Rising Star in Family Law 2023 - Karnataka Bar Association'],
                consultationFee: 1500,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                userId: advUser4.id,
                barCouncilId: 'PENDING',
                specialization: ['Cyber Law', 'Intellectual Property'],
                experienceYears: 3,
                bio: 'New advocate specializing in cyber law and IP. Awaiting verification.',
                rating: 0,
                totalReviews: 0,
                successRate: 0,
                totalCases: 0,
                currentCaseLoad: 0,
                isVerified: false,
                isActive: true,
                isAvailable: true,
                isAcceptingCases: false,
                feeRange: { min: 2000, max: 15000 },
                location: { city: 'Pune', state: 'Maharashtra' },
                officeAddress: { city: 'Pune', state: 'Maharashtra' },
                languages: ['English', 'Hindi'],
                education: [{ degree: 'BBA LLB', university: 'Symbiosis University', year: 2021 }],
                awards: [],
                consultationFee: 1000,
                createdAt: now,
                updatedAt: now
            }
        }
    ];

    console.log('\n⚖️ Creating advocate profiles...');
    for (const adv of advocates) {
        await db.collection('advocates').doc(adv.id).set(adv.data);
        console.log(`   ✅ ${adv.data.barCouncilId} - ${adv.data.specialization.join(', ')}`);
    }

    // ========== CASES ==========
    const cases = [
        {
            id: generateId(),
            data: {
                clientId: client1.id,
                advocateId: advocates[0].id,
                title: 'Property Dispute - Ancestral Land',
                description: 'Dispute regarding ancestral property in Mumbai. Multiple family members claiming ownership. Need legal representation for partition suit.',
                category: 'Property Law',
                status: 'assigned',
                urgencyLevel: 'high',
                location: { city: 'Mumbai', state: 'Maharashtra' },
                aiAnalysis: {
                    category: 'Property',
                    urgencyLevel: 'high',
                    urgencyScore: 78,
                    riskScore: 65,
                    classification: { category: 'Property', subcategory: 'Partition Suit', confidence: 92 }
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Case filed for property partition', createdBy: client1.id, createdAt: now },
                    { event: 'AI Analysis Complete', description: 'Urgency: high, Risk Score: 65', createdBy: client1.id, createdAt: now },
                    { event: 'Advocate Assigned', description: 'Adv. Sunita Reddy assigned', createdBy: client1.id, createdAt: now }
                ],
                assignedAt: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client1.id,
                title: 'Consumer Complaint - Defective Product',
                description: 'Purchased an electronic appliance that stopped working within warranty period. Manufacturer refusing to replace or repair.',
                category: 'Consumer Law',
                status: 'pending_advocate',
                urgencyLevel: 'medium',
                location: { city: 'Mumbai', state: 'Maharashtra' },
                aiAnalysis: {
                    category: 'Consumer',
                    urgencyLevel: 'medium',
                    urgencyScore: 55,
                    riskScore: 40,
                    classification: { category: 'Consumer', subcategory: 'Product Liability', confidence: 88 }
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Consumer complaint filed', createdBy: client1.id, createdAt: now },
                    { event: 'AI Analysis Complete', description: 'Urgency: medium', createdBy: client1.id, createdAt: now }
                ],
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client2.id,
                advocateId: advocates[2].id,
                title: 'Divorce and Child Custody',
                description: 'Filing for divorce due to irreconcilable differences. Need to settle child custody and maintenance matters.',
                category: 'Family Law',
                status: 'in_progress',
                urgencyLevel: 'high',
                location: { city: 'Bangalore', state: 'Karnataka' },
                aiAnalysis: {
                    category: 'Family',
                    urgencyLevel: 'high',
                    urgencyScore: 75,
                    riskScore: 70,
                    classification: { category: 'Family', subcategory: 'Divorce & Custody', confidence: 95 }
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Divorce petition filed', createdBy: client2.id, createdAt: now },
                    { event: 'AI Analysis Complete', description: 'Urgency: high', createdBy: client2.id, createdAt: now },
                    { event: 'Advocate Assigned', description: 'Adv. Meera Joshi assigned', createdBy: client2.id, createdAt: now },
                    { event: 'Status Updated', description: 'Case in progress - mediation scheduled', createdBy: advUser3.id, createdAt: now }
                ],
                assignedAt: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client2.id,
                advocateId: advocates[1].id,
                title: 'Corporate Tax Dispute',
                description: 'Tax assessment disagreement with Income Tax department. Need legal representation for appeal.',
                category: 'Tax Law',
                status: 'in_review',
                urgencyLevel: 'critical',
                location: { city: 'Delhi', state: 'Delhi' },
                aiAnalysis: {
                    category: 'Tax',
                    urgencyLevel: 'critical',
                    urgencyScore: 90,
                    riskScore: 85,
                    classification: { category: 'Tax', subcategory: 'Tax Assessment Appeal', confidence: 90 }
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Tax dispute case filed', createdBy: client2.id, createdAt: now },
                    { event: 'Advocate Assigned', description: 'Adv. Vikram Singh assigned', createdBy: client2.id, createdAt: now }
                ],
                assignedAt: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client3.id,
                advocateId: advocates[0].id,
                title: 'Criminal Defamation Case',
                description: 'False allegations published in local newspaper. Need to file criminal defamation case under IPC 499/500.',
                category: 'Criminal Law',
                status: 'assigned',
                urgencyLevel: 'medium',
                location: { city: 'Mumbai', state: 'Maharashtra' },
                aiAnalysis: {
                    category: 'Criminal',
                    urgencyLevel: 'medium',
                    urgencyScore: 60,
                    riskScore: 50,
                    classification: { category: 'Criminal', subcategory: 'Defamation', confidence: 85 }
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Defamation case filed', createdBy: client3.id, createdAt: now }
                ],
                assignedAt: now,
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client3.id,
                title: 'Employer Wrongful Termination',
                description: 'Terminated from employment without notice or valid reason. Company is withholding final settlement and experience letter.',
                category: 'Labor Law',
                status: 'submitted',
                urgencyLevel: 'high',
                location: { city: 'Hyderabad', state: 'Telangana' },
                aiAnalysis: {
                    category: 'Labor',
                    urgencyLevel: 'high',
                    urgencyScore: 72,
                    riskScore: 60
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Wrongful termination complaint filed', createdBy: client3.id, createdAt: now }
                ],
                createdAt: now,
                updatedAt: now
            }
        },
        {
            id: generateId(),
            data: {
                clientId: client1.id,
                advocateId: advocates[2].id,
                title: 'Domestic Violence Protection Order',
                description: 'Seeking protection order under DV Act. Victim needs immediate legal intervention.',
                category: 'Family Law',
                status: 'completed',
                urgencyLevel: 'critical',
                location: { city: 'Bangalore', state: 'Karnataka' },
                aiAnalysis: {
                    category: 'Family',
                    urgencyLevel: 'critical',
                    urgencyScore: 95,
                    riskScore: 90
                },
                timeline: [
                    { event: 'Case Submitted', description: 'Emergency protection order requested', createdBy: client1.id, createdAt: now },
                    { event: 'Advocate Assigned', description: 'Adv. Meera Joshi assigned', createdBy: client1.id, createdAt: now },
                    { event: 'Status Updated', description: 'Protection order granted by court', createdBy: advUser3.id, createdAt: now }
                ],
                assignedAt: now,
                completedAt: now,
                createdAt: now,
                updatedAt: now
            }
        }
    ];

    console.log('\n📋 Creating cases...');
    for (const c of cases) {
        await db.collection('cases').doc(c.id).set(c.data);
        console.log(`   ✅ ${c.data.title} (${c.data.status})`);
    }

    // ========== NOTIFICATIONS ==========
    const notifications = [
        { userId: client1.id, type: 'case_update', title: 'Case Analyzed', message: 'Your case "Property Dispute" has been analyzed. Urgency: high', relatedCase: cases[0].id, isRead: true, createdAt: now },
        { userId: client1.id, type: 'advocate_accepted', title: 'Advocate Accepted', message: 'Adv. Sunita Reddy has accepted your case', relatedCase: cases[0].id, isRead: true, createdAt: now },
        { userId: client1.id, type: 'case_submitted', title: 'Consumer Complaint Filed', message: 'Your consumer complaint has been submitted', relatedCase: cases[1].id, isRead: false, createdAt: now },
        { userId: client2.id, type: 'case_update', title: 'Case Status Updated', message: 'Your divorce case has entered mediation phase', relatedCase: cases[2].id, isRead: false, createdAt: now },
        { userId: client2.id, type: 'case_update', title: 'Urgent: Tax Case Update', message: 'Your tax dispute case has been marked as critical urgency', relatedCase: cases[3].id, isRead: false, createdAt: now },
        { userId: advUser1.id, type: 'case_request', title: 'New Case Request', message: 'You have a new case request: "Criminal Defamation Case"', relatedCase: cases[4].id, isRead: false, createdAt: now },
        { userId: advUser3.id, type: 'case_update', title: 'Case Completed', message: 'Protection order case has been marked as completed', relatedCase: cases[6].id, isRead: true, createdAt: now },
        { userId: client3.id, type: 'case_submitted', title: 'Case Submitted', message: 'Your wrongful termination complaint has been filed', relatedCase: cases[5].id, isRead: false, createdAt: now }
    ];

    console.log('\n🔔 Creating notifications...');
    for (const notif of notifications) {
        await db.collection('notifications').doc(generateId()).set(notif);
    }
    console.log(`   ✅ ${notifications.length} notifications created`);

    // ========== COMPLAINTS ==========
    const complaints = [
        {
            raisedBy: client2.id,
            type: 'service_quality',
            title: 'Delayed Response from Advocate',
            description: 'My advocate has not responded to messages for over a week.',
            status: 'pending',
            caseId: cases[2].id,
            createdAt: now,
            updatedAt: now
        },
        {
            raisedBy: client3.id,
            type: 'billing',
            title: 'Unexpected Fees',
            description: 'I was charged for a consultation that was supposed to be free.',
            status: 'resolved',
            resolvedBy: adminUser.id,
            resolutionNotes: 'Fee was waived and apology was sent.',
            resolvedAt: now,
            createdAt: now,
            updatedAt: now
        }
    ];

    console.log('\n📢 Creating complaints...');
    for (const complaint of complaints) {
        await db.collection('complaints').doc(generateId()).set(complaint);
    }
    console.log(`   ✅ ${complaints.length} complaints created`);

    // ========== AI LOGS ==========
    const aiLogs = [
        { userId: client1.id, caseId: cases[0].id, type: 'case_analysis', input: 'Property dispute analysis', output: JSON.stringify(cases[0].data.aiAnalysis), model: 'deepseek-chat', tokensUsed: 250, createdAt: now },
        { userId: client2.id, caseId: cases[2].id, type: 'case_analysis', input: 'Divorce case analysis', output: JSON.stringify(cases[2].data.aiAnalysis), model: 'deepseek-chat', tokensUsed: 300, createdAt: now },
        { userId: client1.id, type: 'chat', input: 'What are my rights in a property dispute?', output: 'You have the right to file a partition suit...', model: 'deepseek-chat', tokensUsed: 150, createdAt: now },
        { userId: client2.id, type: 'chat', input: 'How long does a divorce take?', output: 'The timeline for divorce varies...', model: 'deepseek-chat', tokensUsed: 180, createdAt: now }
    ];

    console.log('\n🤖 Creating AI logs...');
    for (const log of aiLogs) {
        await db.collection('aiLogs').doc(generateId()).set(log);
    }
    console.log(`   ✅ ${aiLogs.length} AI logs created`);

    // ========== ACTIVITY LOGS ==========
    const activityLogs = [
        { userId: client1.id, action: 'case_create', entityType: 'case', entityId: cases[0].id, details: { title: cases[0].data.title }, createdAt: now },
        { userId: client1.id, action: 'case_create', entityType: 'case', entityId: cases[1].id, details: { title: cases[1].data.title }, createdAt: now },
        { userId: client2.id, action: 'case_create', entityType: 'case', entityId: cases[2].id, details: { title: cases[2].data.title }, createdAt: now },
        { userId: advUser1.id, action: 'case_accept', entityType: 'case', entityId: cases[0].id, details: { action: 'accept' }, createdAt: now },
        { userId: adminUser.id, action: 'settings_update', entityType: 'settings', entityId: 'system', details: { key: 'urgencyThreshold', value: 70 }, createdAt: now }
    ];

    console.log('\n📝 Creating activity logs...');
    for (const log of activityLogs) {
        await db.collection('activityLogs').doc(generateId()).set(log);
    }
    console.log(`   ✅ ${activityLogs.length} activity logs created`);

    // ========== ADMIN LOGS ==========
    const adminLogs = [
        { adminId: adminUser.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[0].id, createdAt: now },
        { adminId: adminUser.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[1].id, createdAt: now },
        { adminId: adminUser.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[2].id, createdAt: now },
        { adminId: adminUser.id, action: 'settings_update', targetType: 'settings', targetId: 'system', createdAt: now }
    ];

    console.log('\n🛡️ Creating admin logs...');
    for (const log of adminLogs) {
        await db.collection('adminLogs').doc(generateId()).set(log);
    }
    console.log(`   ✅ ${adminLogs.length} admin logs created`);

    // ========== REVIEWS ==========
    const reviews = [
        { advocateId: advocates[0].id, clientId: client1.id, caseId: cases[0].id, rating: 5, comment: 'Excellent lawyer! Very professional and knowledgeable.', createdAt: now },
        { advocateId: advocates[2].id, clientId: client2.id, caseId: cases[2].id, rating: 5, comment: 'Meera was very compassionate and effective. Highly recommend!', createdAt: now },
        { advocateId: advocates[0].id, clientId: client3.id, rating: 4, comment: 'Good experience overall. Responsive and thorough.', createdAt: now },
        { advocateId: advocates[1].id, clientId: client2.id, caseId: cases[3].id, rating: 4, comment: 'Knowledgeable about tax law. Helped resolve my dispute.', createdAt: now }
    ];

    console.log('\n⭐ Creating reviews...');
    for (const review of reviews) {
        await db.collection('reviews').doc(generateId()).set(review);
    }
    console.log(`   ✅ ${reviews.length} reviews created`);

    // ========== SYSTEM SETTINGS ==========
    const settings = [
        { key: 'urgencyThreshold', value: 70, description: 'Urgency score threshold for critical classification', lastUpdatedBy: adminUser.id, createdAt: now, updatedAt: now },
        { key: 'maxCaseLoad', value: 15, description: 'Maximum cases per advocate', lastUpdatedBy: adminUser.id, createdAt: now, updatedAt: now },
        { key: 'aiEnabled', value: true, description: 'Enable AI analysis features', lastUpdatedBy: adminUser.id, createdAt: now, updatedAt: now },
        { key: 'maintenanceMode', value: false, description: 'Platform maintenance mode', lastUpdatedBy: adminUser.id, createdAt: now, updatedAt: now }
    ];

    console.log('\n⚙️ Creating system settings...');
    for (const setting of settings) {
        await db.collection('systemSettings').doc(generateId()).set(setting);
    }
    console.log(`   ✅ ${settings.length} settings created`);

    // ========== DOCUMENTS ==========
    const documents = [
        { caseId: cases[0].id, userId: client1.id, title: 'Property Assessment Report', originalName: 'property_report.pdf', fileType: 'application/pdf', filePath: '/uploads/property_report.pdf', size: 2450000, isVerified: true, createdAt: now, updatedAt: now },
        { caseId: cases[0].id, userId: client1.id, title: 'Land Registry Document', originalName: 'land_registry.pdf', fileType: 'application/pdf', filePath: '/uploads/land_registry.pdf', size: 1200000, isVerified: false, createdAt: now, updatedAt: now },
        { caseId: cases[2].id, userId: client2.id, title: 'Marriage Certificate', originalName: 'marriage_cert.pdf', fileType: 'application/pdf', filePath: '/uploads/marriage_cert.pdf', size: 800000, isVerified: true, createdAt: now, updatedAt: now }
    ];

    console.log('\n📄 Creating documents...');
    for (const doc of documents) {
        await db.collection('documents').doc(generateId()).set(doc);
    }
    console.log(`   ✅ ${documents.length} documents created`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Firebase seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials (password: password123):');
    console.log('   🔑 Admin:     admin@nexora.com');
    console.log('   🔑 Client 1:  client@nexora.com');
    console.log('   🔑 Client 2:  client2@nexora.com');
    console.log('   🔑 Client 3:  client3@nexora.com');
    console.log('   🔑 Advocate 1: advocate@nexora.com');
    console.log('   🔑 Advocate 2: advocate2@nexora.com');
    console.log('   🔑 Advocate 3: advocate3@nexora.com');
    console.log('   🔑 Advocate 4: advocate4@nexora.com (pending verification)');
    console.log('\n📊 Data Summary:');
    console.log(`   👤 ${users.length} users (1 admin, 3 clients, 4 advocates)`);
    console.log(`   ⚖️ ${advocates.length} advocate profiles`);
    console.log(`   📋 ${cases.length} cases`);
    console.log(`   🔔 ${notifications.length} notifications`);
    console.log(`   📢 ${complaints.length} complaints`);
    console.log(`   🤖 ${aiLogs.length} AI logs`);
    console.log(`   📝 ${activityLogs.length} activity logs`);
    console.log(`   🛡️ ${adminLogs.length} admin logs`);
    console.log(`   ⭐ ${reviews.length} reviews`);
    console.log(`   ⚙️ ${settings.length} system settings`);
    console.log(`   📄 ${documents.length} documents`);
    console.log('');

    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
