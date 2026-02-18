import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://nexora-f83b9.firebaseio.com';

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)), databaseURL });
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
        console.error('❌ No Firebase credentials found.');
        process.exit(1);
    }
}

const db = admin.database();
const gid = () => db.ref().push().key;
const now = new Date().toISOString();
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

// Clear collections before seeding
async function clearCollections() {
    const collections = ['users', 'advocates', 'cases', 'notifications', 'complaints', 'aiLogs', 'activityLogs', 'adminLogs', 'reviews', 'systemSettings', 'documents'];
    for (const col of collections) {
        await db.ref(col).remove();
    }
}

async function seed() {
    console.log('🌱 Starting Nexora Firebase Seeder...\n');
    console.log('🗑️  Clearing old data...');
    await clearCollections();

    const salt = await bcrypt.genSalt(12);
    const hp = await bcrypt.hash('password123', salt);

    // ========== USERS ==========
    const users = [
        { id: gid(), data: { name: 'Admin Nexora', email: 'admin@nexora.com', password: hp, role: 'admin', phone: '+91-9000000001', avatar: null, isVerified: true, isActive: true, bio: 'Platform administrator with full access', lastLogin: now, createdAt: ago(120), updatedAt: now } },
        { id: gid(), data: { name: 'Super Admin', email: 'superadmin@nexora.com', password: hp, role: 'admin', phone: '+91-9000000002', avatar: null, isVerified: true, isActive: true, bio: 'Senior platform administrator', lastLogin: ago(1), createdAt: ago(150), updatedAt: now } },
        { id: gid(), data: { name: 'Rahul Sharma', email: 'client@nexora.com', password: hp, role: 'client', phone: '+91-9876543211', avatar: null, isVerified: true, isActive: true, bio: 'Small business owner from Mumbai seeking legal help for property matters', lastLogin: now, createdAt: ago(90), updatedAt: now } },
        { id: gid(), data: { name: 'Priya Patel', email: 'client2@nexora.com', password: hp, role: 'client', phone: '+91-9876543212', avatar: null, isVerified: true, isActive: true, bio: 'IT professional dealing with family law issues', lastLogin: ago(2), createdAt: ago(60), updatedAt: now } },
        { id: gid(), data: { name: 'Amit Kumar', email: 'client3@nexora.com', password: hp, role: 'client', phone: '+91-9876543213', avatar: null, isVerified: true, isActive: true, bio: 'Corporate employee facing wrongful termination', lastLogin: ago(5), createdAt: ago(45), updatedAt: now } },
        { id: gid(), data: { name: 'Neha Gupta', email: 'client4@nexora.com', password: hp, role: 'client', phone: '+91-9876543220', avatar: null, isVerified: true, isActive: true, bio: 'Startup founder needing corporate legal guidance', lastLogin: ago(1), createdAt: ago(30), updatedAt: now } },
        { id: gid(), data: { name: 'Vikash Jain', email: 'client5@nexora.com', password: hp, role: 'client', phone: '+91-9876543221', avatar: null, isVerified: false, isActive: true, bio: 'Student seeking consumer rights advice', createdAt: ago(10), updatedAt: now } },
        { id: gid(), data: { name: 'Adv. Sunita Reddy', email: 'advocate@nexora.com', password: hp, role: 'advocate', phone: '+91-9876543214', avatar: null, isVerified: true, isActive: true, bio: 'Senior Criminal & Civil Lawyer', lastLogin: now, createdAt: ago(200), updatedAt: now } },
        { id: gid(), data: { name: 'Adv. Vikram Singh', email: 'advocate2@nexora.com', password: hp, role: 'advocate', phone: '+91-9876543215', avatar: null, isVerified: true, isActive: true, bio: 'Property & Corporate Law Expert', lastLogin: ago(1), createdAt: ago(180), updatedAt: now } },
        { id: gid(), data: { name: 'Adv. Meera Joshi', email: 'advocate3@nexora.com', password: hp, role: 'advocate', phone: '+91-9876543216', avatar: null, isVerified: true, isActive: true, bio: 'Family & Consumer Law Specialist', lastLogin: ago(3), createdAt: ago(100), updatedAt: now } },
        { id: gid(), data: { name: 'Adv. Rajesh Gupta', email: 'advocate4@nexora.com', password: hp, role: 'advocate', phone: '+91-9876543217', avatar: null, isVerified: false, isActive: true, bio: 'Cyber Law & IP (Pending Verification)', createdAt: ago(15), updatedAt: now } },
        { id: gid(), data: { name: 'Adv. Anjali Deshmukh', email: 'advocate5@nexora.com', password: hp, role: 'advocate', phone: '+91-9876543222', avatar: null, isVerified: true, isActive: true, bio: 'Labor & Employment Law Expert', lastLogin: ago(2), createdAt: ago(130), updatedAt: now } },
    ];

    console.log('👤 Creating users...');
    for (const u of users) {
        await db.ref('users/' + u.id).set(u.data);
        try {
            await admin.auth().createUser({ uid: u.id, email: u.data.email, password: 'password123', displayName: u.data.name, emailVerified: true });
            console.log(`   ✅ ${u.data.name} (${u.data.email})`);
        } catch (e) {
            if (e.code === 'auth/email-already-exists' || e.code === 'auth/uid-already-exists') {
                try { await admin.auth().deleteUser(u.id); } catch (_) { }
                try { const byEmail = await admin.auth().getUserByEmail(u.data.email); await admin.auth().deleteUser(byEmail.uid); } catch (_) { }
                await admin.auth().createUser({ uid: u.id, email: u.data.email, password: 'password123', displayName: u.data.name, emailVerified: true });
                console.log(`   ✅ ${u.data.name} (recreated)`);
            } else { console.error(`   ❌ ${u.data.name}: ${e.message}`); }
        }
    }

    const [adminU, superAdminU, c1, c2, c3, c4, c5, a1u, a2u, a3u, a4u, a5u] = users;

    // ========== ADVOCATES ==========
    const advocates = [
        { id: gid(), data: { userId: a1u.id, barCouncilId: 'MH/1234/2015', specialization: ['Criminal Law', 'Civil Law', 'Constitutional Law'], experienceYears: 12, bio: 'Experienced criminal and civil lawyer with 12+ years of practice. Former public prosecutor with strong track record in High Court. Specialized in bail matters, criminal defense, and civil disputes.', rating: 4.8, totalReviews: 125, successRate: 87, totalCases: 340, currentCaseLoad: 3, isVerified: true, isActive: true, isAvailable: true, isAcceptingCases: true, feeRange: { min: 5000, max: 50000 }, location: { city: 'Mumbai', state: 'Maharashtra' }, officeAddress: { city: 'Mumbai', state: 'Maharashtra', address: '45 Law Chambers, Fort Area, Mumbai 400001' }, languages: ['English', 'Hindi', 'Marathi'], education: [{ degree: 'LLB', university: 'Mumbai University', year: 2011 }, { degree: 'LLM', university: 'NLU Mumbai', year: 2013 }], awards: ['Best Criminal Lawyer 2022 - Maharashtra Bar Council', 'Outstanding Legal Service Award 2020'], consultationFee: 2000, createdAt: ago(200), updatedAt: now } },
        { id: gid(), data: { userId: a2u.id, barCouncilId: 'DL/5678/2012', specialization: ['Property Law', 'Corporate Law', 'Tax Law'], experienceYears: 15, bio: 'Senior property and corporate law specialist handling landmark property dispute cases. Expert in RERA compliance, real estate transactions, corporate restructuring, and tax litigation. Successfully handled 290+ cases across Delhi NCR courts.', rating: 4.6, totalReviews: 98, successRate: 82, totalCases: 290, currentCaseLoad: 5, isVerified: true, isActive: true, isAvailable: true, isAcceptingCases: true, feeRange: { min: 10000, max: 100000 }, location: { city: 'Delhi', state: 'Delhi' }, officeAddress: { city: 'New Delhi', state: 'Delhi', address: '12 Tis Hazari Court Complex, Delhi 110054' }, languages: ['English', 'Hindi', 'Punjabi'], education: [{ degree: 'BA LLB', university: 'Delhi University', year: 2008 }, { degree: 'LLM', university: 'NLU Delhi', year: 2010 }], awards: [], consultationFee: 3000, createdAt: ago(180), updatedAt: now } },
        { id: gid(), data: { userId: a3u.id, barCouncilId: 'KA/9101/2018', specialization: ['Family Law', 'Consumer Law', 'Human Rights'], experienceYears: 8, bio: 'Passionate family and consumer law advocate dedicated to protecting individual rights. Specializes in divorce, custody, domestic violence protection, consumer disputes, and human rights cases.', rating: 4.9, totalReviews: 67, successRate: 91, totalCases: 150, currentCaseLoad: 2, isVerified: true, isActive: true, isAvailable: true, isAcceptingCases: true, feeRange: { min: 3000, max: 30000 }, location: { city: 'Bangalore', state: 'Karnataka' }, officeAddress: { city: 'Bangalore', state: 'Karnataka', address: '78 MG Road, Legal Centre, Bangalore 560001' }, languages: ['English', 'Hindi', 'Kannada'], education: [{ degree: 'BA LLB', university: 'NLSIU Bangalore', year: 2015 }], awards: ['Rising Star in Family Law 2023 - Karnataka Bar Association'], consultationFee: 1500, createdAt: ago(100), updatedAt: now } },
        { id: gid(), data: { userId: a4u.id, barCouncilId: 'PENDING', specialization: ['Cyber Law', 'Intellectual Property'], experienceYears: 3, bio: 'New advocate specializing in cyber law and intellectual property rights. Awaiting bar council verification. Expertise in data privacy, IT Act cases, and patent filing.', rating: 0, totalReviews: 0, successRate: 0, totalCases: 0, currentCaseLoad: 0, isVerified: false, isActive: true, isAvailable: true, isAcceptingCases: false, feeRange: { min: 2000, max: 15000 }, location: { city: 'Pune', state: 'Maharashtra' }, officeAddress: { city: 'Pune', state: 'Maharashtra', address: 'FC Road, Pune 411004' }, languages: ['English', 'Hindi'], education: [{ degree: 'BBA LLB', university: 'Symbiosis University', year: 2021 }], awards: [], consultationFee: 1000, createdAt: ago(15), updatedAt: now } },
        { id: gid(), data: { userId: a5u.id, barCouncilId: 'MH/3456/2014', specialization: ['Labor Law', 'Employment Law', 'Industrial Disputes'], experienceYears: 11, bio: 'Expert in labor and employment law. Handled 200+ cases involving wrongful termination, workplace harassment, wage disputes, and industrial tribunal matters.', rating: 4.5, totalReviews: 82, successRate: 85, totalCases: 215, currentCaseLoad: 4, isVerified: true, isActive: true, isAvailable: true, isAcceptingCases: true, feeRange: { min: 4000, max: 40000 }, location: { city: 'Mumbai', state: 'Maharashtra' }, officeAddress: { city: 'Mumbai', state: 'Maharashtra', address: '22 Nariman Point, Mumbai 400021' }, languages: ['English', 'Hindi', 'Marathi', 'Gujarati'], education: [{ degree: 'LLB', university: 'Government Law College Mumbai', year: 2012 }, { degree: 'LLM (Labor Law)', university: 'Mumbai University', year: 2014 }], awards: ['Labor Law Excellence Award 2021'], consultationFee: 2500, createdAt: ago(130), updatedAt: now } },
    ];

    console.log('\n⚖️ Creating advocate profiles...');
    for (const a of advocates) { await db.ref('advocates/' + a.id).set(a.data); console.log(`   ✅ ${a.data.barCouncilId}`); }

    // ========== CASES ==========
    const cases = [
        { id: gid(), data: { clientId: c1.id, advocateId: advocates[0].id, title: 'Property Dispute - Ancestral Land in Andheri', description: 'Dispute regarding ancestral property worth ₹2.5 Cr in Andheri West, Mumbai. Multiple family members claiming ownership rights. Property was inherited from grandfather and requires a partition suit. The property has no clear will and the revenue records show multiple claimants.', category: 'Property Law', status: 'assigned', urgencyLevel: 'high', location: { city: 'Mumbai', state: 'Maharashtra' }, aiAnalysis: { category: 'Property', urgencyLevel: 'high', urgencyScore: 78, riskScore: 65, classification: { category: 'Property', subcategory: 'Partition Suit', confidence: 92 }, recommendations: ['File partition suit under CPC Order XX', 'Obtain mutation records', 'Get property valuation done'] }, timeline: [{ event: 'Case Submitted', description: 'Case filed for property partition', createdAt: ago(30) }, { event: 'AI Analysis Complete', description: 'Urgency: high, Risk: 65', createdAt: ago(30) }, { event: 'Advocate Assigned', description: 'Adv. Sunita Reddy assigned', createdAt: ago(28) }], assignedAt: ago(28), createdAt: ago(30), updatedAt: ago(5) } },
        { id: gid(), data: { clientId: c1.id, title: 'Consumer Complaint - Defective Laptop', description: 'Purchased a laptop from an authorized dealer for ₹85,000. The laptop stopped working within 3 months during warranty period. Manufacturer is refusing to replace or repair despite multiple complaints. Have all purchase receipts and warranty card.', category: 'Consumer Law', status: 'pending_advocate', urgencyLevel: 'medium', location: { city: 'Mumbai', state: 'Maharashtra' }, aiAnalysis: { category: 'Consumer', urgencyLevel: 'medium', urgencyScore: 55, riskScore: 40, classification: { category: 'Consumer', subcategory: 'Product Liability', confidence: 88 } }, timeline: [{ event: 'Case Submitted', description: 'Consumer complaint filed', createdAt: ago(15) }], createdAt: ago(15), updatedAt: ago(15) } },
        { id: gid(), data: { clientId: c2.id, advocateId: advocates[2].id, title: 'Divorce and Child Custody Settlement', description: 'Filing for mutual consent divorce after 5 years of marriage due to irreconcilable differences. Two children aged 3 and 5. Need to settle child custody arrangement, maintenance amount, and division of jointly owned flat in Whitefield, Bangalore.', category: 'Family Law', status: 'in_progress', urgencyLevel: 'high', location: { city: 'Bangalore', state: 'Karnataka' }, aiAnalysis: { category: 'Family', urgencyLevel: 'high', urgencyScore: 75, riskScore: 70, classification: { category: 'Family', subcategory: 'Divorce & Custody', confidence: 95 } }, timeline: [{ event: 'Case Submitted', createdAt: ago(45) }, { event: 'Advocate Assigned', description: 'Adv. Meera Joshi assigned', createdAt: ago(42) }, { event: 'Mediation Scheduled', description: 'First mediation session on 25th Feb', createdAt: ago(10) }], assignedAt: ago(42), createdAt: ago(45), updatedAt: ago(3) } },
        { id: gid(), data: { clientId: c2.id, advocateId: advocates[1].id, title: 'Income Tax Assessment Appeal', description: 'Income tax department has issued an assessment order adding ₹12 lakhs to my taxable income for AY 2023-24. The additions are based on incorrect interpretation of capital gains from property sale. Need to file appeal before CIT(A) within 30 days.', category: 'Tax Law', status: 'in_review', urgencyLevel: 'critical', location: { city: 'Delhi', state: 'Delhi' }, aiAnalysis: { category: 'Tax', urgencyLevel: 'critical', urgencyScore: 90, riskScore: 85 }, timeline: [{ event: 'Case Submitted', createdAt: ago(20) }, { event: 'Advocate Assigned', description: 'Adv. Vikram Singh assigned', createdAt: ago(18) }], assignedAt: ago(18), createdAt: ago(20), updatedAt: ago(7) } },
        { id: gid(), data: { clientId: c3.id, advocateId: advocates[0].id, title: 'Criminal Defamation - Newspaper Article', description: 'A local newspaper published defamatory allegations about my business practices without verification. The article has caused significant reputation damage and business loss estimated at ₹15 lakhs. Need to file criminal defamation case under IPC 499/500.', category: 'Criminal Law', status: 'assigned', urgencyLevel: 'medium', location: { city: 'Mumbai', state: 'Maharashtra' }, aiAnalysis: { category: 'Criminal', urgencyLevel: 'medium', urgencyScore: 60, riskScore: 50 }, timeline: [{ event: 'Case Submitted', createdAt: ago(25) }, { event: 'Advocate Assigned', createdAt: ago(22) }], assignedAt: ago(22), createdAt: ago(25), updatedAt: ago(10) } },
        { id: gid(), data: { clientId: c3.id, advocateId: advocates[4].id, title: 'Wrongful Termination - IT Company', description: 'Terminated from my position as Senior Developer at a major IT company without notice or valid reason. Company is withholding 2 months salary, PF settlement, and experience letter. HR cited "performance issues" but no PIP was ever issued.', category: 'Labor Law', status: 'in_progress', urgencyLevel: 'high', location: { city: 'Hyderabad', state: 'Telangana' }, aiAnalysis: { category: 'Labor', urgencyLevel: 'high', urgencyScore: 72, riskScore: 60 }, timeline: [{ event: 'Case Submitted', createdAt: ago(35) }, { event: 'Advocate Assigned', description: 'Adv. Anjali Deshmukh assigned', createdAt: ago(32) }, { event: 'Legal Notice Sent', description: 'Demand notice sent to employer', createdAt: ago(20) }], assignedAt: ago(32), createdAt: ago(35), updatedAt: ago(8) } },
        { id: gid(), data: { clientId: c1.id, advocateId: advocates[2].id, title: 'Domestic Violence Protection Order', description: 'Seeking protection order under DV Act 2005. Victim of physical and emotional abuse. Need immediate interim protection order and maintenance for self and minor child.', category: 'Family Law', status: 'completed', urgencyLevel: 'critical', location: { city: 'Bangalore', state: 'Karnataka' }, aiAnalysis: { category: 'Family', urgencyLevel: 'critical', urgencyScore: 95, riskScore: 90 }, timeline: [{ event: 'Case Submitted', createdAt: ago(90) }, { event: 'Advocate Assigned', createdAt: ago(89) }, { event: 'Interim Order Granted', createdAt: ago(85) }, { event: 'Final Order', description: 'Protection order granted by court', createdAt: ago(60) }], assignedAt: ago(89), completedAt: ago(60), createdAt: ago(90), updatedAt: ago(60) } },
        { id: gid(), data: { clientId: c4.id, title: 'Startup Incorporation & Compliance', description: 'Need help incorporating a technology startup as a Private Limited company. Require assistance with MOA/AOA drafting, director appointments, and initial compliance setup including GST registration and startup India recognition.', category: 'Corporate Law', status: 'submitted', urgencyLevel: 'low', location: { city: 'Pune', state: 'Maharashtra' }, aiAnalysis: { category: 'Corporate', urgencyLevel: 'low', urgencyScore: 30, riskScore: 20 }, timeline: [{ event: 'Case Submitted', createdAt: ago(5) }], createdAt: ago(5), updatedAt: ago(5) } },
        { id: gid(), data: { clientId: c4.id, advocateId: advocates[1].id, title: 'Commercial Lease Dispute', description: 'Landlord is demanding 300% rent increase on our office space violating the lease agreement terms. The lease has 2 years remaining with a clause limiting annual increase to 10%. Landlord threatening eviction.', category: 'Property Law', status: 'assigned', urgencyLevel: 'high', location: { city: 'Pune', state: 'Maharashtra' }, aiAnalysis: { category: 'Property', urgencyLevel: 'high', urgencyScore: 70, riskScore: 55 }, timeline: [{ event: 'Case Submitted', createdAt: ago(12) }, { event: 'Advocate Assigned', createdAt: ago(10) }], assignedAt: ago(10), createdAt: ago(12), updatedAt: ago(4) } },
        { id: gid(), data: { clientId: c5.id, title: 'Online Fraud Complaint', description: 'Lost ₹45,000 in an online shopping scam. The seller collected payment through UPI but never delivered the product. Have screenshots of all conversations and payment receipts. Need to file complaint under IT Act and Consumer Protection Act.', category: 'Cyber Crime', status: 'submitted', urgencyLevel: 'medium', location: { city: 'Chennai', state: 'Tamil Nadu' }, aiAnalysis: { category: 'Cyber Crime', urgencyLevel: 'medium', urgencyScore: 58, riskScore: 45 }, timeline: [{ event: 'Case Submitted', createdAt: ago(3) }], createdAt: ago(3), updatedAt: ago(3) } },
    ];

    console.log('\n📋 Creating cases...');
    for (const c of cases) { await db.ref('cases/' + c.id).set(c.data); console.log(`   ✅ ${c.data.title.substring(0, 50)}...`); }

    // ========== NOTIFICATIONS ==========
    const notifs = [
        { userId: c1.id, type: 'case_update', title: 'Case Analyzed', message: 'Your case "Property Dispute" has been analyzed by AI. Urgency: High', relatedCase: cases[0].id, isRead: true, createdAt: ago(30) },
        { userId: c1.id, type: 'advocate_accepted', title: 'Advocate Accepted Your Case', message: 'Adv. Sunita Reddy has accepted your property dispute case', relatedCase: cases[0].id, isRead: true, createdAt: ago(28) },
        { userId: c1.id, type: 'case_submitted', title: 'Consumer Complaint Filed', message: 'Your consumer complaint about defective laptop has been submitted', relatedCase: cases[1].id, isRead: false, createdAt: ago(15) },
        { userId: c2.id, type: 'case_update', title: 'Mediation Scheduled', message: 'Mediation session for your divorce case has been scheduled for 25th Feb', relatedCase: cases[2].id, isRead: false, createdAt: ago(10) },
        { userId: c2.id, type: 'case_update', title: '⚠️ Urgent: Tax Appeal Deadline', message: 'Your tax assessment appeal deadline is approaching. 15 days remaining.', relatedCase: cases[3].id, isRead: false, createdAt: ago(7) },
        { userId: a1u.id, type: 'case_request', title: 'New Case Assigned', message: 'You have been assigned a new case: Criminal Defamation', relatedCase: cases[4].id, isRead: false, createdAt: ago(22) },
        { userId: a3u.id, type: 'case_update', title: 'Case Completed Successfully', message: 'Domestic violence protection order has been granted', relatedCase: cases[6].id, isRead: true, createdAt: ago(60) },
        { userId: c3.id, type: 'case_update', title: 'Legal Notice Sent', message: 'Your advocate has sent a demand notice to your former employer', relatedCase: cases[5].id, isRead: false, createdAt: ago(20) },
        { userId: c4.id, type: 'case_submitted', title: 'Case Submitted', message: 'Your startup incorporation query has been submitted', relatedCase: cases[7].id, isRead: false, createdAt: ago(5) },
        { userId: a5u.id, type: 'case_request', title: 'New Case Assigned', message: 'Wrongful termination case assigned to you', relatedCase: cases[5].id, isRead: true, createdAt: ago(32) },
        { userId: adminU.id, type: 'system', title: 'New Advocate Registration', message: 'Adv. Rajesh Gupta has registered and needs verification', isRead: false, createdAt: ago(15) },
        { userId: adminU.id, type: 'complaint', title: 'New Complaint Filed', message: 'A client has filed a complaint about delayed response', isRead: false, createdAt: ago(8) },
    ];

    console.log('\n🔔 Creating notifications...');
    for (const n of notifs) { await db.ref('notifications/' + gid()).set(n); }
    console.log(`   ✅ ${notifs.length} notifications`);

    // ========== COMPLAINTS ==========
    const complaints = [
        { raisedBy: c2.id, type: 'service_quality', title: 'Delayed Response from Advocate', description: 'My advocate Adv. Vikram Singh has not responded to my messages regarding the tax appeal for over a week. The deadline is approaching and I am very concerned.', status: 'pending', caseId: cases[3].id, createdAt: ago(8), updatedAt: ago(8) },
        { raisedBy: c3.id, type: 'billing', title: 'Unexpected Consultation Fee', description: 'I was charged ₹3000 for a consultation that was advertised as free initial consultation on the advocate profile.', status: 'resolved', resolvedBy: adminU.id, resolutionNotes: 'Fee was waived after verification. Advocate profile updated to clarify fee structure.', resolvedAt: ago(5), createdAt: ago(15), updatedAt: ago(5) },
        { raisedBy: c4.id, type: 'platform', title: 'Document Upload Failed', description: 'Unable to upload lease agreement PDF. Getting error every time I try. File size is 4MB which should be within limits.', status: 'in_progress', caseId: cases[8].id, createdAt: ago(3), updatedAt: ago(2) },
    ];

    console.log('\n📢 Creating complaints...');
    for (const c of complaints) { await db.ref('complaints/' + gid()).set(c); }
    console.log(`   ✅ ${complaints.length} complaints`);

    // ========== REVIEWS ==========
    const reviews = [
        { advocateId: advocates[0].id, clientId: c1.id, caseId: cases[0].id, rating: 5, comment: 'Excellent lawyer! Very professional and knowledgeable about property law. Explained every step clearly and kept me updated throughout the process.', createdAt: ago(10) },
        { advocateId: advocates[2].id, clientId: c2.id, caseId: cases[2].id, rating: 5, comment: 'Meera was incredibly compassionate and supportive during my divorce proceedings. She made the difficult process much easier. Highly recommend for family law matters!', createdAt: ago(5) },
        { advocateId: advocates[0].id, clientId: c3.id, rating: 4, comment: 'Good experience overall. Very responsive on calls and thorough with documentation. Minor delays in court dates but that was beyond her control.', createdAt: ago(20) },
        { advocateId: advocates[1].id, clientId: c2.id, caseId: cases[3].id, rating: 4, comment: 'Very knowledgeable about tax law. Explained the entire appeal process well. Currently handling my case diligently.', createdAt: ago(12) },
        { advocateId: advocates[2].id, clientId: c1.id, caseId: cases[6].id, rating: 5, comment: 'She literally saved my life. Got the protection order within a week. Forever grateful for her dedication and empathy.', createdAt: ago(58) },
        { advocateId: advocates[4].id, clientId: c3.id, caseId: cases[5].id, rating: 4, comment: 'Anjali is very well-versed in labor law. The legal notice she drafted was very comprehensive. Waiting for the final resolution.', createdAt: ago(15) },
    ];

    console.log('\n⭐ Creating reviews...');
    for (const r of reviews) { await db.ref('reviews/' + gid()).set(r); }
    console.log(`   ✅ ${reviews.length} reviews`);

    // ========== AI LOGS ==========
    const aiLogs = [
        { userId: c1.id, caseId: cases[0].id, type: 'case_analysis', input: 'Property dispute ancestral land', output: JSON.stringify(cases[0].data.aiAnalysis), model: 'deepseek-chat', tokensUsed: 250, createdAt: ago(30) },
        { userId: c2.id, caseId: cases[2].id, type: 'case_analysis', input: 'Divorce custody settlement', output: JSON.stringify(cases[2].data.aiAnalysis), model: 'deepseek-chat', tokensUsed: 300, createdAt: ago(45) },
        { userId: c1.id, type: 'chat', input: 'What are my rights in a property dispute?', output: 'Under Indian property law, you have the right to file a partition suit...', model: 'deepseek-chat', tokensUsed: 150, createdAt: ago(25) },
        { userId: c2.id, type: 'chat', input: 'How long does mutual consent divorce take?', output: 'Mutual consent divorce under Hindu Marriage Act typically takes 6-18 months...', model: 'deepseek-chat', tokensUsed: 180, createdAt: ago(40) },
        { userId: c3.id, type: 'chat', input: 'Can I sue for wrongful termination?', output: 'Yes, under the Industrial Disputes Act, you can challenge wrongful termination...', model: 'deepseek-chat', tokensUsed: 200, createdAt: ago(33) },
        { userId: c4.id, type: 'chat', input: 'Steps to incorporate a private limited company', output: 'To incorporate a Pvt Ltd company in India: 1) Obtain DSC and DIN...', model: 'deepseek-chat', tokensUsed: 220, createdAt: ago(4) },
    ];

    console.log('\n🤖 Creating AI logs...');
    for (const l of aiLogs) { await db.ref('aiLogs/' + gid()).set(l); }
    console.log(`   ✅ ${aiLogs.length} AI logs`);

    // ========== ACTIVITY LOGS ==========
    const actLogs = [
        { userId: c1.id, action: 'case_create', entityType: 'case', entityId: cases[0].id, details: { title: 'Property Dispute' }, createdAt: ago(30) },
        { userId: c1.id, action: 'case_create', entityType: 'case', entityId: cases[1].id, details: { title: 'Consumer Complaint' }, createdAt: ago(15) },
        { userId: c2.id, action: 'case_create', entityType: 'case', entityId: cases[2].id, details: { title: 'Divorce & Custody' }, createdAt: ago(45) },
        { userId: c2.id, action: 'case_create', entityType: 'case', entityId: cases[3].id, details: { title: 'Tax Assessment Appeal' }, createdAt: ago(20) },
        { userId: c3.id, action: 'case_create', entityType: 'case', entityId: cases[4].id, details: { title: 'Criminal Defamation' }, createdAt: ago(25) },
        { userId: c3.id, action: 'case_create', entityType: 'case', entityId: cases[5].id, details: { title: 'Wrongful Termination' }, createdAt: ago(35) },
        { userId: a1u.id, action: 'case_accept', entityType: 'case', entityId: cases[0].id, createdAt: ago(28) },
        { userId: a3u.id, action: 'case_accept', entityType: 'case', entityId: cases[2].id, createdAt: ago(42) },
        { userId: adminU.id, action: 'advocate_verify', entityType: 'advocate', entityId: advocates[0].id, createdAt: ago(190) },
        { userId: adminU.id, action: 'advocate_verify', entityType: 'advocate', entityId: advocates[1].id, createdAt: ago(170) },
        { userId: adminU.id, action: 'settings_update', entityType: 'settings', details: { key: 'urgencyThreshold', value: 70 }, createdAt: ago(100) },
    ];

    console.log('\n📝 Creating activity logs...');
    for (const l of actLogs) { await db.ref('activityLogs/' + gid()).set(l); }
    console.log(`   ✅ ${actLogs.length} activity logs`);

    // ========== ADMIN LOGS ==========
    const adLogs = [
        { adminId: adminU.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[0].id, details: { name: 'Adv. Sunita Reddy' }, createdAt: ago(190) },
        { adminId: adminU.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[1].id, details: { name: 'Adv. Vikram Singh' }, createdAt: ago(170) },
        { adminId: adminU.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[2].id, details: { name: 'Adv. Meera Joshi' }, createdAt: ago(95) },
        { adminId: adminU.id, action: 'advocate_approve', targetType: 'advocate', targetId: advocates[4].id, details: { name: 'Adv. Anjali Deshmukh' }, createdAt: ago(125) },
        { adminId: adminU.id, action: 'complaint_resolve', targetType: 'complaint', details: { title: 'Unexpected Fees' }, createdAt: ago(5) },
        { adminId: superAdminU.id, action: 'settings_update', targetType: 'settings', details: { key: 'aiEnabled', value: true }, createdAt: ago(100) },
    ];

    console.log('\n🛡️ Creating admin logs...');
    for (const l of adLogs) { await db.ref('adminLogs/' + gid()).set(l); }
    console.log(`   ✅ ${adLogs.length} admin logs`);

    // ========== SYSTEM SETTINGS ==========
    const settings = [
        { key: 'urgencyThreshold', value: 70, description: 'Urgency score threshold for critical classification', lastUpdatedBy: adminU.id, createdAt: ago(100), updatedAt: now },
        { key: 'maxCaseLoad', value: 15, description: 'Maximum active cases per advocate', lastUpdatedBy: adminU.id, createdAt: ago(100), updatedAt: now },
        { key: 'aiEnabled', value: true, description: 'Enable AI case analysis and chat features', lastUpdatedBy: superAdminU.id, createdAt: ago(100), updatedAt: now },
        { key: 'maintenanceMode', value: false, description: 'Platform maintenance mode toggle', lastUpdatedBy: adminU.id, createdAt: ago(100), updatedAt: now },
        { key: 'autoAssignAdvocate', value: false, description: 'Automatically assign best-matching advocate to new cases', lastUpdatedBy: adminU.id, createdAt: ago(50), updatedAt: now },
        { key: 'maxFileSize', value: 10485760, description: 'Maximum file upload size in bytes (10MB)', lastUpdatedBy: adminU.id, createdAt: ago(100), updatedAt: now },
    ];

    console.log('\n⚙️ Creating system settings...');
    for (const s of settings) { await db.ref('systemSettings/' + gid()).set(s); }
    console.log(`   ✅ ${settings.length} settings`);

    // ========== DOCUMENTS ==========
    const docs = [
        { caseId: cases[0].id, userId: c1.id, title: 'Property Assessment Report', originalName: 'property_report.pdf', fileType: 'application/pdf', filePath: '/uploads/property_report.pdf', size: 2450000, isVerified: true, createdAt: ago(28), updatedAt: ago(28) },
        { caseId: cases[0].id, userId: c1.id, title: 'Land Registry Extract', originalName: 'land_registry.pdf', fileType: 'application/pdf', filePath: '/uploads/land_registry.pdf', size: 1200000, isVerified: false, createdAt: ago(27), updatedAt: ago(27) },
        { caseId: cases[0].id, userId: c1.id, title: 'Family Tree & Inheritance Chain', originalName: 'family_tree.pdf', fileType: 'application/pdf', filePath: '/uploads/family_tree.pdf', size: 560000, isVerified: true, createdAt: ago(26), updatedAt: ago(26) },
        { caseId: cases[2].id, userId: c2.id, title: 'Marriage Certificate', originalName: 'marriage_cert.pdf', fileType: 'application/pdf', filePath: '/uploads/marriage_cert.pdf', size: 800000, isVerified: true, createdAt: ago(44), updatedAt: ago(44) },
        { caseId: cases[2].id, userId: c2.id, title: 'Financial Statement', originalName: 'finances.xlsx', fileType: 'application/vnd.ms-excel', filePath: '/uploads/finances.xlsx', size: 340000, isVerified: false, createdAt: ago(40), updatedAt: ago(40) },
        { caseId: cases[5].id, userId: c3.id, title: 'Termination Letter', originalName: 'termination_letter.pdf', fileType: 'application/pdf', filePath: '/uploads/termination_letter.pdf', size: 220000, isVerified: true, createdAt: ago(34), updatedAt: ago(34) },
        { caseId: cases[5].id, userId: c3.id, title: 'Salary Slips (Last 6 Months)', originalName: 'salary_slips.pdf', fileType: 'application/pdf', filePath: '/uploads/salary_slips.pdf', size: 1500000, isVerified: true, createdAt: ago(33), updatedAt: ago(33) },
    ];

    console.log('\n📄 Creating documents...');
    for (const d of docs) { await db.ref('documents/' + gid()).set(d); }
    console.log(`   ✅ ${docs.length} documents`);

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Firebase seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials (password: password123):');
    console.log('   🔑 Admin:       admin@nexora.com');
    console.log('   🔑 Super Admin: superadmin@nexora.com');
    console.log('   🔑 Client 1:    client@nexora.com');
    console.log('   🔑 Client 2:    client2@nexora.com');
    console.log('   🔑 Client 3:    client3@nexora.com');
    console.log('   🔑 Client 4:    client4@nexora.com');
    console.log('   🔑 Client 5:    client5@nexora.com');
    console.log('   🔑 Advocate 1:  advocate@nexora.com');
    console.log('   🔑 Advocate 2:  advocate2@nexora.com');
    console.log('   🔑 Advocate 3:  advocate3@nexora.com');
    console.log('   🔑 Advocate 4:  advocate4@nexora.com (pending)');
    console.log('   🔑 Advocate 5:  advocate5@nexora.com');
    console.log(`\n📊 Data: ${users.length} users, ${advocates.length} advocates, ${cases.length} cases, ${notifs.length} notifs, ${complaints.length} complaints, ${reviews.length} reviews, ${docs.length} documents\n`);
    process.exit(0);
}

seed().catch(e => { console.error('❌ Seeding failed:', e); process.exit(1); });
