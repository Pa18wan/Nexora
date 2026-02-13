// Enhanced Seeder for Nexora Legal Platform - Debug Version
import mongoose from 'mongoose';
import dotenv from 'dotenv';


import User from './models/User.js';
import Advocate from './models/Advocate.js';
import Case from './models/Case.js';
import Notification from './models/Notification.js';
import Complaint from './models/Complaint.js';
import AILog from './models/AILog.js';
import ActivityLog from './models/ActivityLog.js';
import AdminLog from './models/AdminLog.js';
import Document from './models/Document.js';
import Review from './models/Review.js';
import SystemSettings from './models/SystemSettings.js';

dotenv.config();

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharva', 'Advait', 'Pranav', 'Kabir', 'Rudra', 'Dhruv', 'Arnav', 'Dev', 'Yash',
    'Saanvi', 'Aanya', 'Aadhya', 'Diya', 'Pihu', 'Ananya', 'Myra', 'Sara', 'Ira', 'Kavya',
    'Priya', 'Neha', 'Pooja', 'Sneha', 'Riya', 'Sakshi', 'Anjali', 'Divya', 'Nisha', 'Kritika',
    'Rahul', 'Amit', 'Vikram', 'Suresh', 'Rajesh', 'Manoj', 'Deepak', 'Sanjay', 'Vinod', 'Prakash'];

const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Menon', 'Iyer',
    'Rao', 'Joshi', 'Kulkarni', 'Deshmukh', 'Patil', 'Shinde', 'Jadhav', 'More', 'Pawar', 'Chavan',
    'Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh', 'Bose', 'Sen', 'Roy', 'Dutta', 'Chakraborty',
    'Pillai', 'Nambiar', 'Krishnan', 'Subramaniam', 'Raghavan', 'Venkatesh', 'Srinivasan', 'Raman', 'Gopal', 'Anand',
    'Agarwal', 'Mittal', 'Goel', 'Jain', 'Mehta', 'Shah', 'Gandhi', 'Modi', 'Bhatt', 'Trivedi'];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh'];
const specializations = ['Criminal Law', 'Civil Law', 'Family Law', 'Property Law', 'Corporate Law', 'Tax Law', 'Labor Law', 'Consumer Law', 'Cyber Law', 'Constitutional Law'];
const categories = ['Criminal', 'Civil', 'Family', 'Property', 'Corporate', 'Tax', 'Labor', 'Consumer', 'Cyber', 'Constitutional', 'Other'];

async function seedDatabase() {
    console.log('\n========== NEXORA DATABASE SEEDING ==========\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear all collections
        console.log('Clearing collections...');
        await User.deleteMany({});
        await Advocate.deleteMany({});
        await Case.deleteMany({});
        await Notification.deleteMany({});
        await Complaint.deleteMany({});
        await AILog.deleteMany({});
        await ActivityLog.deleteMany({});
        await AdminLog.deleteMany({});
        await Document.deleteMany({});
        await Review.deleteMany({});
        await SystemSettings.deleteMany({});
        console.log('All collections cleared\n');

        const plainPassword = 'password123';

        // 1. USERS
        console.log('Creating Users...');
        const adminUsers = [];
        for (let i = 0; i < 5; i++) {
            const admin = await User.create({
                name: `Admin ${firstNames[i]}`,
                email: i === 0 ? 'admin@nexora.com' : `admin${i + 1}@nexora.com`,
                password: plainPassword,
                role: 'admin',
                isVerified: true,
                isActive: true
            });
            adminUsers.push(admin);
        }
        console.log(`  Created ${adminUsers.length} admins`);

        const clientUsers = [];
        for (let i = 0; i < 50; i++) {
            const client = await User.create({
                name: `${firstNames[i % 50]} ${lastNames[i % 50]}`,
                email: i === 0 ? 'client1@example.com' : `client${i + 1}@example.com`,
                password: plainPassword,
                role: 'client',
                isVerified: true,
                isActive: true
            });
            clientUsers.push(client);
        }
        console.log(`  Created ${clientUsers.length} clients`);

        const advocateUsers = [];
        for (let i = 0; i < 50; i++) {
            const adv = await User.create({
                name: `Adv. ${firstNames[(i + 25) % 50]} ${lastNames[(i + 10) % 50]}`,
                email: i === 0 ? 'advocate1@example.com' : `advocate${i + 1}@example.com`,
                password: plainPassword,
                role: 'advocate',
                isVerified: true,
                isActive: true
            });
            advocateUsers.push(adv);
        }
        console.log(`  Created ${advocateUsers.length} advocates\n`);

        // 2. ADVOCATE PROFILES
        console.log('Creating Advocate Profiles...');
        const advocates = [];
        for (let i = 0; i < 50; i++) {
            try {
                const advocate = await Advocate.create({
                    userId: advocateUsers[i]._id,
                    barCouncilId: `BAR/MH/2015/${String(1000 + i).padStart(5, '0')}`,
                    specialization: [specializations[i % 10]],
                    experienceYears: getRandomNumber(2, 25),
                    bio: `Experienced advocate specializing in ${specializations[i % 10]}.`,
                    rating: getRandomFloat(3.5, 5.0),
                    totalReviews: getRandomNumber(10, 100),
                    successRate: getRandomNumber(70, 95),
                    totalCases: getRandomNumber(50, 300),
                    currentCaseLoad: getRandomNumber(2, 10),
                    isVerified: true,
                    isAvailable: true,
                    isActive: true,
                    feeRange: { min: 5000, max: 50000 },
                    location: { city: cities[i % 10], state: states[i % 10], country: 'India' },
                    languages: ['English', 'Hindi']
                });
                advocates.push(advocate);
            } catch (err) {
                console.error(`  Error creating advocate ${i}:`, err.message);
            }
        }
        console.log(`  Created ${advocates.length} advocate profiles\n`);

        // 3. CASES
        console.log('Creating Cases...');
        const cases = [];
        const statuses = ['submitted', 'in_progress', 'resolved', 'closed'];
        for (let i = 0; i < 50; i++) {
            try {
                const status = statuses[i % 4];
                const hasAdvocate = status !== 'submitted';
                const caseDoc = await Case.create({
                    clientId: clientUsers[i % 50]._id,
                    advocateId: hasAdvocate ? advocates[i % 50]._id : null,
                    title: `Case ${i + 1}: ${categories[i % 11]} Matter`,
                    description: `This is a detailed description for case ${i + 1} regarding a ${categories[i % 11].toLowerCase()} matter that requires legal consultation and representation.`,
                    category: categories[i % 11],
                    location: { city: cities[i % 10], state: states[i % 10], country: 'India' },
                    urgencyLevel: getRandomItem(['low', 'medium', 'high']),
                    status: status,
                    priority: 'normal',
                    paymentStatus: 'pending'
                });
                cases.push(caseDoc);
            } catch (err) {
                console.error(`  Error creating case ${i}:`, err.message);
            }
        }
        console.log(`  Created ${cases.length} cases\n`);

        // 4. NOTIFICATIONS
        console.log('Creating Notifications...');
        const notifTypes = ['case_update', 'advocate_assigned', 'message_received', 'system'];
        const notifications = [];
        for (let i = 0; i < 50; i++) {
            try {
                const notif = await Notification.create({
                    userId: clientUsers[i % 50]._id,
                    type: notifTypes[i % 4],
                    title: `Notification ${i + 1}`,
                    message: `This is a test notification message number ${i + 1}.`,
                    relatedCase: cases[i % cases.length]._id,
                    priority: 'normal',
                    isRead: i % 2 === 0
                });
                notifications.push(notif);
            } catch (err) {
                console.error(`  Error creating notification ${i}:`, err.message);
            }
        }
        console.log(`  Created ${notifications.length} notifications\n`);

        // 5. COMPLAINTS
        console.log('Creating Complaints...');
        const complaintTypes = ['delay', 'communication', 'overcharging', 'misconduct', 'other'];
        const complaints = [];
        for (let i = 0; i < 50; i++) {
            try {
                const complaint = await Complaint.create({
                    caseId: cases[i % cases.length]._id,
                    raisedBy: clientUsers[i % 50]._id,
                    againstAdvocate: advocates[i % 50]._id,
                    type: complaintTypes[i % 5],
                    subject: `Complaint ${i + 1} regarding service`,
                    description: `This is a test complaint number ${i + 1} regarding service quality issues.`,
                    status: 'submitted',
                    priority: 'medium'
                });
                complaints.push(complaint);
            } catch (err) {
                console.error(`  Error creating complaint ${i}:`, err.message);
            }
        }
        console.log(`  Created ${complaints.length} complaints\n`);

        // 6. AI LOGS
        console.log('Creating AI Logs...');
        const aiLogs = [];
        for (let i = 0; i < 50; i++) {
            try {
                const aiLog = await AILog.create({
                    userId: clientUsers[i % 50]._id,
                    caseId: cases[i % cases.length]._id,
                    type: 'chat',
                    input: `Query ${i + 1}: Legal question about ${categories[i % 11]}`,
                    output: `AI Response ${i + 1}: Here is legal advice...`,
                    model: 'deepseek-chat',
                    tokensUsed: getRandomNumber(200, 1500),
                    responseTime: getRandomNumber(500, 3000),
                    success: true
                });
                aiLogs.push(aiLog);
            } catch (err) {
                console.error(`  Error creating AI log ${i}:`, err.message);
            }
        }
        console.log(`  Created ${aiLogs.length} AI logs\n`);

        // 7. ACTIVITY LOGS
        console.log('Creating Activity Logs...');
        const activityActions = ['login', 'case_create', 'case_view', 'document_upload', 'profile_update'];
        const activityLogs = [];
        for (let i = 0; i < 50; i++) {
            try {
                const log = await ActivityLog.create({
                    userId: clientUsers[i % 50]._id,
                    action: activityActions[i % 5],
                    entityType: 'case',
                    entityId: cases[i % cases.length]._id,
                    ipAddress: `192.168.1.${i + 1}`,
                    userAgent: 'Mozilla/5.0'
                });
                activityLogs.push(log);
            } catch (err) {
                console.error(`  Error creating activity log ${i}:`, err.message);
            }
        }
        console.log(`  Created ${activityLogs.length} activity logs\n`);

        // 8. ADMIN LOGS
        console.log('Creating Admin Logs...');
        const adminActions = ['user_block', 'advocate_approve', 'settings_update', 'complaint_resolve'];
        const adminLogs = [];
        for (let i = 0; i < 50; i++) {
            try {
                const log = await AdminLog.create({
                    adminId: adminUsers[i % 5]._id,
                    action: adminActions[i % 4],
                    targetType: 'user',
                    targetId: clientUsers[i % 50]._id,
                    reason: `Admin action ${i + 1}`,
                    ipAddress: `10.0.0.${i + 1}`
                });
                adminLogs.push(log);
            } catch (err) {
                console.error(`  Error creating admin log ${i}:`, err.message);
            }
        }
        console.log(`  Created ${adminLogs.length} admin logs\n`);

        // 9. DOCUMENTS
        console.log('Creating Documents...');
        const docCategories = ['evidence', 'petition', 'affidavit', 'contract', 'other'];
        const documents = [];
        for (let i = 0; i < 50; i++) {
            try {
                const doc = await Document.create({
                    caseId: cases[i % cases.length]._id,
                    uploadedBy: clientUsers[i % 50]._id,
                    filename: `doc_${i + 1}_${Date.now()}.pdf`,
                    originalName: `Document_${i + 1}.pdf`,
                    mimeType: 'application/pdf',
                    size: getRandomNumber(100000, 2000000),
                    filePath: `/uploads/docs/doc_${i + 1}.pdf`,
                    category: docCategories[i % 5],
                    description: `Legal document ${i + 1}`
                });
                documents.push(doc);
            } catch (err) {
                console.error(`  Error creating document ${i}:`, err.message);
            }
        }
        console.log(`  Created ${documents.length} documents\n`);

        // 10. REVIEWS
        console.log('Creating Reviews...');
        const reviews = [];
        const resolvedCases = cases.filter(c => ['resolved', 'closed'].includes(c.status));
        for (let i = 0; i < Math.min(25, resolvedCases.length); i++) {
            try {
                const review = await Review.create({
                    caseId: resolvedCases[i]._id,
                    clientId: resolvedCases[i].clientId,
                    advocateId: resolvedCases[i].advocateId || advocates[0]._id,
                    rating: getRandomNumber(3, 5),
                    comment: `Great service! Review ${i + 1}`,
                    isPublic: true,
                    isVerified: true
                });
                reviews.push(review);
            } catch (err) {
                // Skip duplicate
            }
        }
        console.log(`  Created ${reviews.length} reviews\n`);

        // 11. SYSTEM SETTINGS
        console.log('Creating System Settings...');
        const settings = [
            { key: 'urgencyThreshold', value: 70, description: 'Urgency threshold', category: 'case' },
            { key: 'maxCaseLoad', value: 15, description: 'Max case load', category: 'advocate' },
            { key: 'aiEnabled', value: true, description: 'AI enabled', category: 'ai' },
            { key: 'platformFee', value: 10, description: 'Platform fee %', category: 'billing' },
            { key: 'maintenanceMode', value: false, description: 'Maintenance mode', category: 'system' }
        ];
        for (const s of settings) {
            await SystemSettings.create({ ...s, updatedBy: adminUsers[0]._id });
        }
        console.log(`  Created ${settings.length} settings\n`);

        // SUMMARY
        console.log('\n========== SEEDING COMPLETE ==========');
        console.log(`Users: ${adminUsers.length + clientUsers.length + advocateUsers.length}`);
        console.log(`Advocates: ${advocates.length}`);
        console.log(`Cases: ${cases.length}`);
        console.log(`Notifications: ${notifications.length}`);
        console.log(`Complaints: ${complaints.length}`);
        console.log(`AI Logs: ${aiLogs.length}`);
        console.log(`Activity Logs: ${activityLogs.length}`);
        console.log(`Admin Logs: ${adminLogs.length}`);
        console.log(`Documents: ${documents.length}`);
        console.log(`Reviews: ${reviews.length}`);
        console.log(`Settings: ${settings.length}`);
        console.log('\nDemo Credentials:');
        console.log('  Admin: admin@nexora.com / password123');
        console.log('  Client: client1@example.com / password123');
        console.log('  Advocate: advocate1@example.com / password123');
        console.log('=======================================\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\nSEEDING FAILED:', error.message);
        console.error(error.stack);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedDatabase();
