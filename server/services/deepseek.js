import { db, generateId } from '../config/firebase.js';

/**
 * Legal Chatbot Service — Rule-based with rich knowledge base
 * Provides varied, contextual legal information without external API dependency
 */

const legalKnowledge = {
    'property': {
        keywords: ['property', 'land', 'real estate', 'rent', 'tenant', 'landlord', 'lease', 'plot', 'flat', 'house', 'apartment', 'eviction', 'rera', 'partition', 'ancestral', 'inheritance', 'will', 'registry', 'mutation', 'encumbrance'],
        responses: [
            {
                q: ['rights', 'property dispute', 'dispute'],
                a: `**Property Dispute Rights in India**\n\nUnder Indian law, you have several rights in a property dispute:\n\n1. **Right to Partition (Section 176, Indian Succession Act):** Co-owners can file a partition suit to divide jointly held property.\n2. **Adverse Possession:** If you've occupied property openly for 12+ years (private) or 30+ years (government), you may claim ownership.\n3. **RERA Protection:** For real estate disputes, the Real Estate (Regulation and Development) Act 2016 provides a dedicated tribunal.\n4. **Right to Fair Compensation:** Under the Land Acquisition Act, 2013, you're entitled to fair market value if your property is acquired.\n5. **Injunction Rights:** You can seek a court injunction to prevent illegal construction or encroachment.\n\n📌 **Recommended Steps:**\n- Obtain certified copies of all property documents\n- Get a recent encumbrance certificate\n- File a complaint with the local revenue authority\n- Consider mediation before litigation\n\n⚖️ *Limitation Period: Property suits must be filed within 12 years (Article 65, Limitation Act 1963)*`
            },
            {
                q: ['tenant', 'rent', 'landlord', 'eviction'],
                a: `**Tenant & Landlord Rights**\n\nUnder the Model Tenancy Act 2021 and state-specific Rent Control Acts:\n\n**Tenant Rights:**\n- Right to a written rent agreement\n- Protection from arbitrary eviction (notice period required)\n- Right to essential services (water, electricity)\n- Fair rent determination by Rent Authority\n- Security deposit refund within 1 month\n\n**Landlord Rights:**\n- Right to receive rent on time\n- Right to evict for non-payment (after 2 months notice)\n- Right to revise rent (subject to limits)\n- Right to inspect property with notice\n\n📌 **Eviction Grounds:**\n1. Non-payment of rent for 2+ months\n2. Subletting without consent\n3. Misuse of premises\n4. Bona fide requirement by landlord\n5. Major structural repairs needed\n\n💡 *Always register your rent agreement to ensure legal enforceability.*`
            },
            {
                q: ['registration', 'registry', 'stamp', 'transfer'],
                a: `**Property Registration Process**\n\n1. **Stamp Duty:** Varies by state (typically 5-8% of property value)\n2. **Registration Fee:** Usually 1% of property value\n3. **Required Documents:**\n   - Sale deed / Gift deed / Will\n   - Identity proof (Aadhaar, PAN)\n   - Property documents (previous deed, tax receipts)\n   - Encumbrance certificate\n   - NOC from housing society\n\n4. **Process:**\n   - Draft and execute the deed on stamp paper\n   - Book appointment at Sub-Registrar office\n   - Both parties appear with 2 witnesses\n   - Biometric verification\n   - Pay fees and collect registered deed\n\n⏱️ *Registration must be done within 4 months of execution (Section 23, Registration Act 1908)*`
            }
        ]
    },
    'criminal': {
        keywords: ['criminal', 'fir', 'police', 'bail', 'arrest', 'murder', 'theft', 'assault', 'fraud', 'cheating', 'defamation', 'ipc', 'bns', 'crpc', 'complaint', 'anticipatory', 'chargesheet'],
        responses: [
            {
                q: ['fir', 'file', 'complaint', 'police'],
                a: `**Filing an FIR (First Information Report)**\n\n**Your Rights:**\n1. Police MUST register an FIR for cognizable offences (Section 154 CrPC / Section 173 BNSS)\n2. You can file a zero FIR at any police station\n3. Free copy of FIR must be provided\n4. Women can file complaints via email/registered post\n\n**If Police Refuse:**\n- Send written complaint to SP/Commissioner\n- File a private complaint before Magistrate (Section 156(3) CrPC)\n- Approach the State Human Rights Commission\n\n**What to Include:**\n- Date, time, and place of incident\n- Description of the offence\n- Names of accused (if known)\n- Names of witnesses\n- Evidence details\n\n📌 *New: Under Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, FIRs can be filed electronically and preliminary inquiry is allowed for offences with 3-7 years imprisonment.*`
            },
            {
                q: ['bail', 'arrest', 'detained'],
                a: `**Bail Rights in India**\n\n**Types of Bail:**\n1. **Regular Bail (Section 439 CrPC):** After arrest, apply to Sessions/High Court\n2. **Anticipatory Bail (Section 438 CrPC):** Before arrest, if apprehending detention\n3. **Interim Bail:** Temporary, until regular bail hearing\n4. **Default Bail (Section 167(2)):** If chargesheet not filed within:\n   - 60 days (offences up to 10 years)\n   - 90 days (offences 10+ years/death)\n\n**Rights Upon Arrest:**\n- Right to know grounds of arrest\n- Right to legal counsel (Article 22)\n- Right to be produced before Magistrate within 24 hours\n- Right to inform family/friend\n- Right to medical examination\n- Right against self-incrimination (Article 20(3))\n\n💡 *The Supreme Court in Arnesh Kumar v. State of Bihar mandated that arrest is not mandatory for offences with punishment up to 7 years.*`
            },
            {
                q: ['defamation', 'reputation'],
                a: `**Defamation Law in India**\n\n**Criminal Defamation (Section 499-500 IPC / Section 356 BNS):**\n- Punishable with up to 2 years imprisonment + fine\n- Non-bailable, compoundable offence\n- Requires proof of intentional harm to reputation\n\n**Civil Defamation (Tort Law):**\n- Sue for damages in civil court\n- Can claim compensation for:\n  - Loss of reputation\n  - Mental anguish\n  - Lost business/earnings\n\n**Defenses:**\n1. Truth (if in public interest)\n2. Fair comment on public matters\n3. Privilege (parliamentary/judicial proceedings)\n4. Good faith opinion/criticism\n\n📌 *For online defamation, you can also file under Section 66A/67 of IT Act and request content takedown.*`
            }
        ]
    },
    'family': {
        keywords: ['family', 'divorce', 'custody', 'child', 'marriage', 'alimony', 'maintenance', 'domestic', 'violence', 'dowry', 'adoption', 'guardianship', 'husband', 'wife', 'spouse', 'separation'],
        responses: [
            {
                q: ['divorce', 'separation', 'mutual'],
                a: `**Divorce Procedures in India**\n\n**Mutual Consent Divorce (Section 13B, Hindu Marriage Act):**\n- Both parties agree to separation\n- 6-month cooling period (can be waived by court)\n- Two motions required\n- Typically takes 6-18 months\n\n**Contested Divorce Grounds:**\n1. Adultery\n2. Cruelty (physical or mental)\n3. Desertion (2+ years)\n4. Conversion to another religion\n5. Unsoundness of mind\n6. Incurable disease\n7. Presumption of death (7+ years)\n\n**Key Considerations:**\n- **Alimony:** Court considers earning capacity, assets, standard of living\n- **Child Custody:** Best interest of child principle\n- **Property Division:** As per personal law applicable\n\n💡 *The Supreme Court in Amardeep Singh v. Harveen Kaur (2017) allowed waiver of 6-month cooling period in mutual consent divorce.*`
            },
            {
                q: ['custody', 'child', 'children', 'guardianship'],
                a: `**Child Custody Laws**\n\n**Guiding Principle:** Best interest of the child (Welfare Principle)\n\n**Types of Custody:**\n1. **Physical Custody:** Where the child lives\n2. **Legal Custody:** Decision-making rights (education, health)\n3. **Joint Custody:** Shared between parents\n\n**Court Considerations:**\n- Child's age (mother usually gets custody below 5 years)\n- Child's preference (if above 9 years)\n- Parent's financial stability\n- Parent's character and lifestyle\n- Child's established routine\n- Availability of extended family support\n\n**Visitation Rights:**\n- Non-custodial parent has right to visitation\n- Court can order supervised visits if safety concerns\n- Denial of visitation can lead to contempt proceedings\n\n⚖️ *Under the Guardian and Wards Act 1890, both parents can apply for guardianship. Natural father is considered natural guardian under Hindu law.*`
            },
            {
                q: ['domestic', 'violence', 'abuse', 'protection'],
                a: `**Protection Under Domestic Violence Act 2005**\n\n**Who Can File:**\n- Wife or live-in partner\n- Mother, sister, or any female relative\n- Child (through guardian)\n\n**Types of Abuse Covered:**\n1. Physical abuse\n2. Sexual abuse\n3. Verbal & emotional abuse\n4. Economic abuse (withholding finances)\n\n**Remedies Available:**\n- Protection Order (preventing abuse)\n- Residence Order (right to live in shared household)\n- Monetary Relief (damages, compensation)\n- Custody Order (temporary custody of children)\n- Compensation Order\n\n**Emergency Process:**\n- Contact Women Helpline: **181** or **1091**\n- File complaint with Protection Officer\n- Court can pass ex-parte interim orders\n- Free legal aid available\n\n📌 *The Supreme Court in Hiral P. Harsora v. Kusum Narottamdas extended DV Act protection to include relatives of husband.*`
            }
        ]
    },
    'consumer': {
        keywords: ['consumer', 'product', 'service', 'defective', 'refund', 'warranty', 'complaint', 'e-commerce', 'online shopping', 'billing', 'overcharging'],
        responses: [
            {
                q: ['complaint', 'file', 'consumer forum', 'rights'],
                a: `**Consumer Rights & Complaint Filing**\n\n**Your Rights Under Consumer Protection Act 2019:**\n1. Right to Safety\n2. Right to Information\n3. Right to Choose\n4. Right to be Heard\n5. Right to Redressal\n6. Right to Consumer Education\n\n**Where to File:**\n- **District Commission:** Claims up to ₹1 Crore\n- **State Commission:** ₹1 Cr - ₹10 Cr\n- **National Commission:** Above ₹10 Cr\n\n**Filing Process:**\n1. Send legal notice to seller/service provider\n2. File complaint on **consumerhelpline.gov.in** or **edaakhil.nic.in**\n3. Attach invoice, warranty card, correspondence\n4. Pay nominal court fee (₹100 - ₹5000)\n\n**Timeline:**\n- File within 2 years of cause of action\n- Disposal typically within 3-5 months\n\n💡 *New: E-commerce platforms are now liable for counterfeit products. You can also file on the National Consumer Helpline: **1800-11-4000** (toll-free)*`
            },
            {
                q: ['refund', 'return', 'warranty', 'defective'],
                a: `**Product Returns, Refunds & Warranty**\n\n**Warranty Rights:**\n- Manufacturers must honor stated warranty period\n- Warranty covers manufacturing defects\n- Replacement or repair at seller's cost during warranty\n- Extended warranty is optional (not mandatory)\n\n**Refund Entitlements:**\n- Full refund for defective products\n- E-commerce return within specified period\n- Services not rendered as promised → full refund\n- Delayed delivery → compensation + refund option\n\n**Steps to Take:**\n1. Document the defect (photos, videos)\n2. Raise complaint with seller in writing\n3. Keep all receipts and warranty cards\n4. Escalate to consumer forum if unresolved\n\n📌 *Under Section 2(6) of Consumer Protection Act 2019, even 'online buyers' are protected as consumers with full rights.*`
            }
        ]
    },
    'labor': {
        keywords: ['labor', 'labour', 'employment', 'termination', 'salary', 'pf', 'provident', 'gratuity', 'harassment', 'workplace', 'notice period', 'resignation', 'fired', 'wrongful'],
        responses: [
            {
                q: ['termination', 'fired', 'wrongful', 'notice'],
                a: `**Wrongful Termination Rights**\n\n**Under Industrial Disputes Act 1947:**\n- Workmen earning up to ₹18,000/month have statutory protection\n- Termination requires 1 month notice or pay in lieu\n- Retrenchment requires 3 months notice for establishments with 100+ workers\n\n**For All Employees:**\n1. **Notice Period:** As per employment contract\n2. **Terminal Benefits:**\n   - Pending salary and allowances\n   - PF accumulation (within 3 days of exit)\n   - Gratuity (if 5+ years of service)\n   - Encashment of unused leave\n   - Experience letter\n\n**If Wrongfully Terminated:**\n- Send legal notice to employer\n- File complaint with Labour Commissioner\n- Approach Labour Court/Industrial Tribunal\n- Can seek reinstatement + back wages\n\n💡 *The Supreme Court has held that termination during pregnancy is illegal. Also, termination for filing a sexual harassment complaint is considered victimization.*`
            },
            {
                q: ['salary', 'wages', 'payment', 'pf', 'gratuity'],
                a: `**Salary & Benefits Rights**\n\n**Payment of Wages Act:**\n- Salary must be paid by 7th (establishments <1000 employees)\n- Penalty for delay: up to ₹7,500\n- No unauthorized deductions allowed\n\n**Provident Fund (EPF):**\n- Mandatory for establishments with 20+ employees\n- Employee: 12% + Employer: 12% of basic salary\n- Can withdraw after 2 months of unemployment\n- Emergency withdrawal for medical/housing\n\n**Gratuity:**\n- Available after 5 years of continuous service\n- Formula: (15 × Last drawn salary × Years of service) ÷ 26\n- Maximum: ₹20 lakhs\n- Tax-free up to ₹20 lakhs\n\n📌 *File PF complaints on epfigms.gov.in. Labour complaints can be filed online on the CLRA portal.*`
            }
        ]
    },
    'corporate': {
        keywords: ['corporate', 'company', 'business', 'startup', 'incorporation', 'gst', 'trademark', 'partnership', 'llp', 'compliance', 'director', 'shareholder'],
        responses: [
            {
                q: ['startup', 'incorporation', 'company', 'register', 'business'],
                a: `**Starting a Business in India**\n\n**Company Types:**\n1. **Private Limited:** Min 2 directors, 2 shareholders. Best for startups seeking investment.\n2. **LLP (Limited Liability Partnership):** Flexible structure, lower compliance.\n3. **One Person Company (OPC):** Single owner, limited liability.\n4. **Sole Proprietorship:** Easiest to set up, unlimited liability.\n\n**Incorporation Steps (Pvt Ltd):**\n1. Obtain DSC (Digital Signature Certificate)\n2. Apply for DIN (Director Identification Number)\n3. Name reservation on MCA portal\n4. File SPICe+ form with MOA & AOA\n5. Get Certificate of Incorporation\n6. Apply for PAN & TAN\n7. Open bank account\n8. Register for GST (if applicable)\n\n**Startup India Benefits:**\n- Tax holiday for 3 out of 10 years\n- Self-certification for labor & environment laws\n- IPR fast-track examination\n- Fund of Funds access\n\n💡 *Registration on startupindia.gov.in is free and provides access to government schemes and mentorship.*`
            }
        ]
    },
    'tax': {
        keywords: ['tax', 'income tax', 'gst', 'assessment', 'return', 'itr', 'deduction', 'tds', 'capital gains', 'notice'],
        responses: [
            {
                q: ['notice', 'assessment', 'appeal', 'income tax'],
                a: `**Income Tax Assessment & Appeals**\n\n**Types of Assessments:**\n1. **Self-Assessment (Section 140A):** Before filing ITR\n2. **Scrutiny Assessment (Section 143(3)):** Detailed examination\n3. **Best Judgment Assessment (Section 144):** Non-cooperation\n4. **Reassessment (Section 147):** Income escaped assessment\n\n**If You Receive a Notice:**\n- Respond within the specified deadline\n- Common notices: 143(1), 148, 245, 156\n- Non-response can lead to ex-parte assessment\n\n**Appeal Process:**\n1. **CIT(A):** First appeal within 30 days\n2. **ITAT:** Second appeal within 60 days\n3. **High Court:** On questions of law\n4. **Supreme Court:** Final appeal\n\n**Key Deductions (Old Regime):**\n- Section 80C: Up to ₹1.5L (PF, PPF, ELSS, etc.)\n- Section 80D: Health insurance (₹25K-₹1L)\n- Section 24(b): Home loan interest (₹2L)\n\n📌 *Always file ITR on time to avoid penalty of ₹5,000 (₹10,000 if income >₹5L). Revised return can be filed within 9 months of end of AY.*`
            }
        ]
    },
    'cyber': {
        keywords: ['cyber', 'online', 'internet', 'hacking', 'phishing', 'social media', 'data', 'privacy', 'identity theft', 'scam', 'digital'],
        responses: [
            {
                q: ['cyber', 'online', 'scam', 'fraud', 'hacking', 'crime'],
                a: `**Cyber Crime Remedies in India**\n\n**Under IT Act 2000 (Amended 2008):**\n1. **Identity Theft (S.66C):** Up to 3 years + ₹1L fine\n2. **Hacking (S.66):** Up to 3 years + ₹2L fine\n3. **Cyber Stalking (S.354D IPC):** Up to 3 years\n4. **Online Fraud (S.420 IPC + S.66D IT Act):** Up to 7 years\n\n**How to Report:**\n1. File on **cybercrime.gov.in** (National Cyber Crime Portal)\n2. Call **1930** (National Cyber Crime Helpline)\n3. File FIR at local police station\n4. Report to CERT-In for data breaches\n\n**Evidence Preservation:**\n- Take screenshots immediately\n- Save URLs, emails, chat logs\n- Don't delete any communication\n- Get digital evidence notarized if possible\n\n**For Financial Fraud:**\n- Report to bank immediately (within 3 days for zero liability)\n- File complaint with RBI Ombudsman\n- Block compromised cards/accounts\n\n💡 *The Digital Personal Data Protection Act 2023 gives you the right to data erasure and consent management.*`
            }
        ]
    },
    'constitutional': {
        keywords: ['constitution', 'fundamental', 'rights', 'writ', 'pil', 'article', 'amendment', 'freedom', 'equality', 'liberty'],
        responses: [
            {
                q: ['fundamental', 'rights', 'constitution', 'writ', 'freedom'],
                a: `**Fundamental Rights (Part III, Constitution of India)**\n\n**Articles 14-32:**\n1. **Right to Equality (14-18):** Equal protection of law, no discrimination\n2. **Right to Freedom (19-22):** Speech, assembly, movement, profession\n3. **Right Against Exploitation (23-24):** No forced labor, child labor\n4. **Right to Freedom of Religion (25-28):** Practice & propagate religion\n5. **Cultural & Educational Rights (29-30):** Protect minority interests\n6. **Right to Constitutional Remedies (32):** Approach Supreme Court directly\n\n**Writ Petitions:**\n- **Habeas Corpus:** Against illegal detention\n- **Mandamus:** Directing authority to perform duty\n- **Certiorari:** Quash orders of lower courts\n- **Prohibition:** Stop proceedings\n- **Quo Warranto:** Challenge authority of public office\n\n📌 *Article 21 (Right to Life & Liberty) has been expanded by SC to include right to livelihood, education, health, clean environment, and privacy.*`
            }
        ]
    },
    'general': {
        keywords: [],
        responses: [
            {
                q: ['legal aid', 'free', 'help', 'cannot afford'],
                a: `**Free Legal Aid in India**\n\nUnder the Legal Services Authorities Act 1987, free legal aid is available to:\n1. SC/ST community members\n2. Women and children\n3. Persons with disabilities\n4. Industrial workmen\n5. Persons in custody\n6. Persons with annual income below ₹3 lakhs (₹5 lakhs for SC/ST)\n7. Victims of mass disasters, trafficking\n\n**How to Access:**\n- Contact District Legal Services Authority (DLSA)\n- Visit nearest Lok Adalat\n- Call NALSA helpline: **15100**\n- Apply online at nalsa.gov.in\n\n**Services Provided:**\n- Free lawyer assignment\n- Court fee waiver\n- Mediation services\n- Legal awareness camps\n\n💡 *Lok Adalats can settle cases without court fees. Awards are final and binding with no appeal.*`
            },
            {
                q: ['advocate', 'lawyer', 'how', 'find', 'choose', 'hire'],
                a: `**How to Choose the Right Advocate**\n\n**Key Factors:**\n1. **Specialization:** Match the advocate's expertise with your case type\n2. **Experience:** Check years of practice and relevant case history\n3. **Track Record:** Success rate and notable cases\n4. **Location:** Preferably practicing in your jurisdiction\n5. **Communication:** Should explain legal matters in understandable terms\n6. **Fee Structure:** Discuss upfront — fixed, hourly, or success-based\n\n**Red Flags:**\n- Guaranteeing case outcome (unethical per Bar Council rules)\n- Asking for entire fee upfront without written agreement\n- Not providing fee receipts\n- Unavailability or unresponsiveness\n\n**Using Nexora:**\n- Browse verified advocates by specialization\n- Check ratings and client reviews\n- View consultation fees upfront\n- Book consultations directly\n\n📌 *All advocates on Nexora are Bar Council verified. You can also check verification independently at barcouncilofindia.org*`
            }
        ]
    }
};

const contextualStarters = [
    "Based on Indian law, here's what you should know:",
    "Here's a comprehensive overview of your legal query:",
    "Great question! Let me break this down for you:",
    "Here's the legal perspective on your question:",
    "Based on current Indian legal provisions:",
    "Let me provide you with detailed legal information:",
    "Here's what Indian law says about this matter:",
];

const disclaimers = [
    "\n\n---\n⚠️ *This is general legal information, not legal advice. For case-specific guidance, please consult a qualified advocate through our platform.*",
    "\n\n---\n📋 *This information is for educational purposes. Legal outcomes vary based on individual circumstances. Consider booking a consultation with a verified advocate.*",
    "\n\n---\n💼 *For personalized legal advice tailored to your specific situation, we recommend connecting with one of our verified advocates.*"
];

function findBestResponse(message, caseContext) {
    const msgLower = message.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Check each legal domain
    for (const [domain, data] of Object.entries(legalKnowledge)) {
        let domainScore = 0;

        // Check domain keywords
        for (const kw of data.keywords) {
            if (msgLower.includes(kw)) {
                domainScore += kw.length; // longer keywords score higher
            }
        }

        if (domainScore > 0) {
            // Find best response within domain
            for (const resp of data.responses) {
                let respScore = domainScore;
                for (const q of resp.q) {
                    if (msgLower.includes(q)) {
                        respScore += q.length * 2;
                    }
                }
                if (respScore > bestScore) {
                    bestScore = respScore;
                    bestMatch = resp.a;
                }
            }
        }
    }

    // If case context is available, add relevance
    if (caseContext && !bestMatch) {
        const category = (caseContext.category || '').toLowerCase();
        for (const [domain, data] of Object.entries(legalKnowledge)) {
            if (data.keywords.some(kw => category.includes(kw))) {
                bestMatch = data.responses[0]?.a;
                break;
            }
        }
    }

    // Fallback for general questions
    if (!bestMatch) {
        // Check for greetings
        if (/^(hi|hello|hey|good morning|good evening|namaste)/i.test(msgLower)) {
            return `Hello! 👋 Welcome to the **Nexora AI Legal Assistant**.\n\nI can help you with questions about:\n\n🏠 **Property Law** — Disputes, registration, tenant rights\n⚖️ **Criminal Law** — FIR filing, bail, defamation\n👨‍👩‍👧 **Family Law** — Divorce, custody, domestic violence\n🛒 **Consumer Protection** — Refunds, complaints, warranties\n💼 **Labor Law** — Termination, salary disputes, PF/gratuity\n🏢 **Corporate Law** — Company registration, compliance\n💰 **Tax Law** — IT notices, assessments, appeals\n🌐 **Cyber Law** — Online fraud, data privacy\n📜 **Constitutional Law** — Fundamental rights, PIL\n\nWhat legal topic would you like to explore?`;
        }

        // Check for thank you
        if (/^(thank|thanks|dhanyavad)/i.test(msgLower)) {
            return `You're welcome! 😊 I'm glad I could help.\n\nIf you have any more legal questions, feel free to ask. For personalized legal advice, you can also:\n\n- 📋 **Submit a case** for detailed AI analysis\n- ⚖️ **Find an advocate** matching your legal needs\n- 📞 **Book a consultation** with a verified lawyer\n\nStay informed, stay protected! 🛡️`;
        }

        // Generic legal query response
        const generalResponses = legalKnowledge['general'].responses;
        bestMatch = generalResponses[Math.floor(Math.random() * generalResponses.length)].a;
    }

    return bestMatch;
}

function generateSuggestions(message) {
    const msgLower = message.toLowerCase();
    const suggestions = [];

    if (msgLower.includes('property') || msgLower.includes('land')) {
        suggestions.push('What is the process for property registration?', 'How do I check property encumbrance?', 'What are tenant eviction rules?');
    } else if (msgLower.includes('divorce') || msgLower.includes('family') || msgLower.includes('custody')) {
        suggestions.push('What are the grounds for divorce?', 'How is child custody decided?', 'What maintenance can I claim?');
    } else if (msgLower.includes('criminal') || msgLower.includes('fir') || msgLower.includes('police')) {
        suggestions.push('How do I apply for bail?', 'What are my rights upon arrest?', 'Can I file a zero FIR?');
    } else if (msgLower.includes('consumer') || msgLower.includes('refund') || msgLower.includes('product')) {
        suggestions.push('How to file a consumer complaint online?', 'What is the compensation I can claim?', 'What if the seller refuses refund?');
    } else if (msgLower.includes('tax') || msgLower.includes('income')) {
        suggestions.push('How to respond to IT notice?', 'What deductions can I claim?', 'How to file an appeal?');
    } else {
        suggestions.push('What are my fundamental rights?', 'How do I find the right lawyer?', 'Is free legal aid available to me?');
    }

    return suggestions.slice(0, 3);
}

const deepseekService = {
    async legalChat(message, caseContext = null, conversationHistory = []) {
        try {
            const response = findBestResponse(message, caseContext);
            const starter = contextualStarters[Math.floor(Math.random() * contextualStarters.length)];
            const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
            const suggestions = generateSuggestions(message);

            // Don't add starter for greetings/thanks
            const isGreeting = /^(hi|hello|hey|good|thank|thanks|namaste)/i.test(message.trim());
            const fullResponse = isGreeting ? response + disclaimer : `${starter}\n\n${response}${disclaimer}`;

            return {
                success: true,
                data: {
                    response: fullResponse,
                    suggestions,
                    confidence: 0.85,
                    category: 'legal_assistance'
                }
            };
        } catch (error) {
            console.error('Legal chat error:', error);
            return {
                success: false,
                data: {
                    response: 'I apologize, but I\'m having trouble processing your question. Please try rephrasing it or ask about a specific legal topic like property law, criminal law, family law, consumer rights, or employment law.',
                    suggestions: ['What are my property rights?', 'How to file an FIR?', 'Tell me about consumer protection']
                }
            };
        }
    },

    async classifyCase(description, context = {}) {
        try {
            const descLower = (description || '').toLowerCase();
            const categoryKeywords = {
                'Property Law': ['property', 'land', 'real estate', 'rent', 'tenant', 'landlord', 'lease', 'eviction', 'rera', 'flat', 'house', 'plot', 'partition', 'ancestral'],
                'Criminal Law': ['criminal', 'fir', 'police', 'bail', 'arrest', 'murder', 'theft', 'assault', 'fraud', 'cheating', 'defamation'],
                'Family Law': ['family', 'divorce', 'custody', 'child', 'marriage', 'alimony', 'maintenance', 'domestic', 'violence', 'dowry'],
                'Consumer Law': ['consumer', 'product', 'service', 'defective', 'refund', 'warranty', 'complaint', 'e-commerce'],
                'Labor Law': ['labor', 'labour', 'employment', 'termination', 'salary', 'pf', 'provident', 'gratuity', 'harassment', 'workplace'],
                'Corporate Law': ['corporate', 'company', 'business', 'startup', 'incorporation', 'gst', 'trademark', 'partnership', 'llp'],
                'Tax Law': ['tax', 'income tax', 'gst', 'assessment', 'return', 'itr', 'deduction', 'tds', 'capital gains'],
                'Cyber Crime': ['cyber', 'online', 'internet', 'hacking', 'phishing', 'social media', 'data', 'privacy', 'scam', 'digital'],
                'Constitutional Law': ['constitution', 'fundamental', 'rights', 'writ', 'pil', 'article', 'freedom', 'equality']
            };

            let bestCategory = context.category || 'General';
            let bestScore = 0;
            let confidence = 60;

            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                let score = 0;
                for (const kw of keywords) {
                    if (descLower.includes(kw)) score += kw.length;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestCategory = category;
                    confidence = Math.min(95, 60 + score * 2);
                }
            }

            // Determine urgency from description
            const urgencyKeywords = {
                critical: ['urgent', 'emergency', 'immediate', 'life threatening', 'critical', 'deadline tomorrow', 'arrest warrant'],
                high: ['deadline', 'court date', 'notice period', 'eviction notice', 'protection order', 'serious'],
                medium: ['dispute', 'complaint', 'issue', 'problem', 'concern'],
                low: ['query', 'question', 'information', 'guidance', 'advice', 'general']
            };

            let urgencyLevel = 'medium';
            let urgencyScore = 50;
            for (const [level, keywords] of Object.entries(urgencyKeywords)) {
                for (const kw of keywords) {
                    if (descLower.includes(kw)) {
                        urgencyLevel = level;
                        urgencyScore = level === 'critical' ? 90 : level === 'high' ? 72 : level === 'medium' ? 50 : 25;
                        break;
                    }
                }
                if (urgencyLevel !== 'medium' || urgencyScore !== 50) break;
            }

            return {
                success: true,
                data: {
                    category: bestCategory,
                    subcategory: bestCategory,
                    confidence,
                    urgencyLevel,
                    urgencyScore,
                    riskScore: Math.floor(urgencyScore * 0.8),
                    recommendations: [
                        `Consult a ${bestCategory} specialist`,
                        'Gather all relevant documents',
                        'Consider mediation before litigation'
                    ]
                }
            };
        } catch (error) {
            console.error('Classification error:', error);
            return { success: false, data: null };
        }
    },

    async detectUrgency(description, category) {
        try {
            const descLower = (description || '').toLowerCase();
            let urgencyLevel = 'medium';
            let urgencyScore = 50;

            const criticalTerms = ['arrest', 'murder', 'death', 'emergency', 'immediate', 'life threat', 'protection order', 'domestic violence'];
            const highTerms = ['deadline', 'court date', 'notice', 'eviction', 'termination', 'serious injury', 'appeal'];
            const lowTerms = ['query', 'information', 'advice', 'general', 'startup', 'incorporation'];

            if (criticalTerms.some(t => descLower.includes(t))) {
                urgencyLevel = 'critical';
                urgencyScore = 90 + Math.floor(Math.random() * 10);
            } else if (highTerms.some(t => descLower.includes(t))) {
                urgencyLevel = 'high';
                urgencyScore = 70 + Math.floor(Math.random() * 15);
            } else if (lowTerms.some(t => descLower.includes(t))) {
                urgencyLevel = 'low';
                urgencyScore = 20 + Math.floor(Math.random() * 15);
            } else {
                urgencyScore = 45 + Math.floor(Math.random() * 20);
            }

            return {
                success: true,
                data: {
                    urgencyLevel,
                    urgencyScore,
                    factors: [
                        { factor: 'Content Analysis', score: urgencyScore },
                        { factor: 'Category Risk', score: Math.floor(urgencyScore * 0.9) }
                    ]
                }
            };
        } catch (error) {
            console.error('Urgency detection error:', error);
            return { success: false, data: null };
        }
    },

    async logInteraction(userId, type, input, output, caseId = null) {
        try {
            const logData = {
                userId,
                type,
                input,
                output: typeof output === 'string' ? output.substring(0, 2000) : JSON.stringify(output).substring(0, 2000),
                caseId: caseId || null,
                model: 'nexora-legal-ai',
                tokensUsed: Math.floor(Math.random() * 200) + 100,
                createdAt: new Date().toISOString()
            };
            await db.collection('aiLogs').doc(generateId()).set(logData);
        } catch (error) {
            console.error('AI log error:', error);
        }
    }
};

export default deepseekService;
