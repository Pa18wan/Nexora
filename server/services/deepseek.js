import axios from 'axios';
import { db } from '../config/firebase.js';
import { legalKnowledge, synonymMap } from './legalKnowledgeBase.js';

/**
 * Legal Chatbot Service — Combined Rule-based + LLM (DeepSeek)
 * Uses high-confidence rules for common queries and DeepSeek for complex ones.
 */

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

const contextualStarters = [
    "Based on Indian law, here's what you should know:",
    "Here's a comprehensive overview of your legal query:",
    "Let me break this down for you from a legal perspective:",
    "Based on current Indian legal provisions:",
    "I'd be happy to help! Here's the relevant legal information:",
];

const disclaimers = [
    "\n\n---\n⚠️ *This is general legal information, not legal advice. For case-specific guidance, please consult a qualified advocate through our platform.*",
    "\n\n---\n💼 *For personalized legal advice tailored to your specific situation, we recommend connecting with one of our verified advocates.*"
];

/**
 * Expand user message with synonyms
 */
function expandWithSynonyms(message) {
    let expanded = message.toLowerCase();
    for (const [key, synonyms] of Object.entries(synonymMap)) {
        for (const syn of synonyms) {
            if (expanded.includes(syn)) {
                expanded += ` ${key}`;
            }
        }
    }
    return expanded;
}

/**
 * Tokenize message
 */
function tokenize(text) {
    return (text || '').toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

/**
 * Calculate similarity score
 */
function tokenOverlap(queryTokens, targetTokens) {
    let score = 0;
    for (const qt of queryTokens) {
        for (const tt of targetTokens) {
            if (qt === tt) {
                score += tt.length * 3;
            } else if (tt.includes(qt) || qt.includes(tt)) {
                score += Math.min(qt.length, tt.length);
            }
        }
    }
    return score;
}

/**
 * Find rule-based response
 */
function findRuleResponse(message, caseContext) {
    const msgExpanded = expandWithSynonyms(message);
    const msgTokens = tokenize(msgExpanded);
    let bestMatch = null;
    let bestScore = 0;
    let matchedDomain = null;

    for (const [domain, data] of Object.entries(legalKnowledge)) {
        let domainScore = 0;
        for (const kw of data.keywords) {
            if (msgExpanded.includes(kw)) {
                domainScore += kw.length * 2;
            } else {
                const kwTokens = tokenize(kw);
                domainScore += tokenOverlap(msgTokens, kwTokens) * 0.5;
            }
        }

        if (domainScore > 0) {
            for (const resp of data.responses) {
                let respScore = domainScore;
                for (const q of resp.q) {
                    if (msgExpanded.includes(q)) {
                        respScore += q.length * 5;
                    } else {
                        const qTokens = tokenize(q);
                        respScore += tokenOverlap(msgTokens, qTokens) * 2;
                    }
                }
                if (respScore > bestScore) {
                    bestScore = respScore;
                    bestMatch = resp.a;
                    matchedDomain = domain;
                }
            }
        }
    }

    return { response: bestMatch, score: bestScore, domain: matchedDomain };
}

/**
 * Call DeepSeek API for intelligent responses
 */
async function askDeepSeek(message, conversationHistory = [], caseContext = null) {
    if (!API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Build system prompt with legal context
    let systemPrompt = `You are the Nexora AI Legal Assistant, an expert in Indian Law. 
Your goal is to provide helpful, accurate, and easy-to-understand legal information based on Indian statutes (IPC, BNS, CrPC, BNSS, Family Laws, etc.).

Guidelines:
1. Format your response with clear Markdown (headers, bold text, lists).
2. Categorize information logically.
3. Always clarify that you are providing information, not professional legal advice.
4. If the question is about an Indian legal procedure, provide step-by-step guidance.
5. Use a professional yet empathetic tone.
6. Limit response to ~300-500 words.

Knowledge Base Reference:
We have specific expertise in: Property Law, Criminal Law, Family Law, Consumer Protection, Labor/Employment, Corporate/Startup Law, Tax Law, Cyber Crime, Constitutional Rights, Motor Vehicle Accidents, Banking Disputes, and Education Law.`;

    if (caseContext) {
        systemPrompt += `\n\nUser's Current Case Context:
Title: ${caseContext.title}
Category: ${caseContext.category}
Description: ${caseContext.description}`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5),
        { role: 'user', content: message }
    ];

    try {
        const response = await axios.post(`${API_URL}/chat/completions`, {
            model: 'deepseek-chat',
            messages,
            temperature: 0.5,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        throw error;
    }
}

function generateSuggestions(message, matchedDomain) {
    const suggestions = [];
    const domainSuggestions = {
        'property': ['How to check property encumbrance?', 'Process for property registration', 'Tenant eviction rules in India'],
        'criminal': ['Rights upon arrest by police', 'Difference between bailable and non-bailable offences', 'How to file an anticipatory bail?'],
        'family': ['Grounds for contested divorce', 'Child custody laws in India', 'Maintenance rights for wife'],
        'consumer': ['How to file a case in Consumer Forum?', 'Refund rules for defective products', 'Medical negligence compensation'],
        'labor': ['Wrongful termination legal action', 'PF withdrawal rules', 'Sexual harassment at workplace rights'],
        'corporate': ['Steps to register a Private Limited Company', 'Trademark registration process', 'Startup India benefits'],
        'tax': ['Income Tax notice response guide', 'GST registration process', 'Capital gains tax rules'],
        'cyber': ['How to report online financial fraud?', 'Legal action against cyber stalking', 'Identity theft laws'],
        'constitutional': ['How to file a Writ Petition?', 'Right to Information (RTI) process', 'Fundamental Rights overview'],
        'motor_vehicle': ['Accident compensation claim process', 'Traffic fine amounts', 'Hit and run case laws'],
        'banking': ['What to do if a cheque bounces?', 'Banking Ombudsman process', 'Loan recovery harassment rights'],
        'education': ['Anti-ragging laws in colleges', 'University fee refund rules', 'Student rights in India']
    };

    if (matchedDomain && domainSuggestions[matchedDomain]) {
        suggestions.push(...domainSuggestions[matchedDomain].slice(0, 3));
    }

    if (suggestions.length < 3) {
        const defaults = ['What are my fundamental rights?', 'How do I find a verified lawyer?', 'Free legal aid eligibility'];
        for (const d of defaults) {
            if (suggestions.length >= 3) break;
            if (!suggestions.includes(d)) suggestions.push(d);
        }
    }

    return suggestions.slice(0, 3);
}

const deepseekService = {
    async legalChat(message, caseContext = null, conversationHistory = []) {
        try {
            const msgTrimmed = message.trim();
            
            if (/^(hi|hello|hey|greetings|namaste)/i.test(msgTrimmed)) {
                return {
                    success: true,
                    data: {
                        response: `Hello! 👋 I'm your **Nexora AI Legal Assistant**.\n\nI can help you with questions about Indian law, including:\n- 🏠 Property Disputes & Registration\n- ⚖️ Criminal Law (FIR, Bail, Arrest)\n- 👨‍👩‍👧 Family Law (Divorce, Custody)\n- 🛒 Consumer Rights & Negligence\n- 💼 Employment Law\n- 🌐 Cyber Crimes\n\nHow can I assist you today?`,
                        suggestions: ['Tell me about property rights', 'How to file an FIR?', 'What are my fundamental rights?'],
                        confidence: 1.0,
                        category: 'system'
                    }
                };
            }

            if (/^(thank|thanks|great|nice|shukriya|dhanyavad)/i.test(msgTrimmed)) {
                return {
                    success: true,
                    data: {
                        response: `You're very welcome! I'm glad I could help. 😊 If you have any more questions, feel free to ask. \n\nYou can also find expert advocates on our platform for more personalized guidance.`,
                        suggestions: ['Find an advocate', 'Submit a case', 'Book a consultation'],
                        confidence: 1.0,
                        category: 'system'
                    }
                };
            }

            const ruleResult = findRuleResponse(message, caseContext);
            
            // Use rule-based response if we have ANY meaningful match (threshold=15)
            if (ruleResult.score > 15 && ruleResult.response) {
                const starter = contextualStarters[Math.floor(Math.random() * contextualStarters.length)];
                const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
                return {
                    success: true,
                    data: {
                        response: `${starter}\n\n${ruleResult.response}${disclaimer}`,
                        suggestions: generateSuggestions(message, ruleResult.domain),
                        confidence: ruleResult.score > 50 ? 0.95 : 0.80,
                        category: ruleResult.domain
                    }
                };
            }

            // Try DeepSeek AI for questions that don't match any rule
            try {
                const aiResponse = await askDeepSeek(message, conversationHistory, caseContext);
                const suggestions = generateSuggestions(message, ruleResult.domain);
                return {
                    success: true,
                    data: {
                        response: aiResponse,
                        suggestions,
                        confidence: 0.85,
                        category: ruleResult.domain || 'ai_assistance'
                    }
                };
            } catch (aiError) {
                console.error('DeepSeek API failed, using fallback:', aiError.message);
                
                // If DeepSeek fails but we have a weak rule match, use it anyway
                if (ruleResult.response) {
                    const starter = contextualStarters[Math.floor(Math.random() * contextualStarters.length)];
                    const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
                    return {
                        success: true,
                        data: {
                            response: `${starter}\n\n${ruleResult.response}${disclaimer}`,
                            suggestions: generateSuggestions(message, ruleResult.domain),
                            confidence: 0.70,
                            category: ruleResult.domain
                        }
                    };
                }

                // Absolute fallback - return a helpful response, NOT an error
                return {
                    success: true,
                    data: {
                        response: `I understand you have a legal question. While I couldn't find a specific match in my knowledge base, here are some general suggestions:\n\n**You can try asking about specific topics like:**\n- 🏠 Property rights, registration, or disputes\n- ⚖️ FIR filing, bail, or arrest rights\n- 👨‍👩‍👧 Divorce, custody, or maintenance\n- 🛒 Consumer complaints or refunds\n- 💼 Employment termination or salary issues\n- 🌐 Cyber crime or online fraud\n- 💰 Tax notices or GST\n- 🚗 Road accidents or traffic fines\n- 🏦 Cheque bounce or loan recovery\n\n**Tips for better answers:**\n- Use specific legal terms (e.g., "bail", "FIR", "divorce")\n- Mention the type of law area\n- Ask one question at a time\n\n---\n⚖️ *For complex questions, we recommend consulting with a verified advocate on our platform.*`,
                        suggestions: ['How to file an FIR?', 'What are my property rights?', 'Tell me about consumer protection'],
                        confidence: 0.50,
                        category: 'general'
                    }
                };
            }

        } catch (error) {
            console.error('Chat error:', error);
            // NEVER return success:false — always give user something useful
            return {
                success: true,
                data: {
                    response: "I apologize for the inconvenience. Let me help you with your legal question — please try rephrasing it, or ask about a specific topic like **property law**, **criminal law**, **family law**, **consumer rights**, or **employment law**.\n\n💡 *Tip: You can also browse our verified advocates for personalized legal guidance.*",
                    suggestions: ['Property law help', 'Criminal law help', 'Family law help']
                }
            };
        }
    },

    async classifyCase(description, context = {}) {
        try {
            const descLower = (description || '').toLowerCase();
            const descExpanded = expandWithSynonyms(descLower);
            const categoryKeywords = {
                'Property Law': ['property', 'land', 'real estate', 'rent', 'tenant', 'landlord', 'lease', 'eviction', 'rera', 'flat', 'house', 'plot', 'partition', 'ancestral'],
                'Criminal Law': ['criminal', 'fir', 'police', 'bail', 'arrest', 'murder', 'theft', 'assault', 'fraud', 'cheating', 'defamation'],
                'Family Law': ['family', 'divorce', 'custody', 'child', 'marriage', 'alimony', 'maintenance', 'domestic', 'violence', 'dowry'],
                'Consumer Law': ['consumer', 'product', 'service', 'defective', 'refund', 'warranty', 'complaint', 'e-commerce'],
                'Labor Law': ['labor', 'labour', 'employment', 'termination', 'salary', 'pf', 'provident', 'gratuity', 'harassment', 'workplace'],
                'Corporate Law': ['corporate', 'company', 'business', 'startup', 'incorporation', 'gst', 'trademark', 'partnership', 'llp'],
                'Tax Law': ['tax', 'income tax', 'gst', 'assessment', 'return', 'itr', 'deduction', 'tds', 'capital gains'],
                'Cyber Crime': ['cyber', 'online', 'internet', 'hacking', 'phishing', 'social media', 'data', 'privacy', 'scam', 'digital'],
                'Constitutional Law': ['constitution', 'fundamental', 'rights', 'writ', 'pil', 'article', 'freedom', 'equality'],
                'Motor Vehicle': ['accident', 'vehicle', 'motor', 'car', 'bike', 'traffic', 'challan', 'road'],
                'Banking Law': ['bank', 'loan', 'cheque', 'bounce', 'emi', 'credit', 'npa', 'recovery'],
                'Education Law': ['education', 'school', 'college', 'ragging', 'student', 'university'],
                'Environmental Law': ['environment', 'pollution', 'noise', 'waste', 'ngt', 'wildlife', 'animal']
            };

            let bestCategory = context.category || 'General Civil';
            let bestScore = 0;
            let confidence = 60;

            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                let score = 0;
                for (const kw of keywords) {
                    if (descExpanded.includes(kw)) score += kw.length;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestCategory = category;
                    confidence = Math.min(95, 60 + score * 2);
                }
            }

            return {
                success: true,
                data: {
                    category: bestCategory,
                    confidence,
                    urgencyLevel: 'medium',
                    recommendations: [`Consult a ${bestCategory} specialist`, 'Gather all relevant documents']
                }
            };
        } catch (error) {
            return { success: false, data: null };
        }
    },

    async detectUrgency(description, category) {
        const descLower = (description || '').toLowerCase();
        let level = 'medium';
        let score = 50;

        const criticalTerms = ['arrest', 'murder', 'death', 'emergency', 'immediate', 'life threat', 'protection order', 'domestic violence'];
        const highTerms = ['deadline', 'court date', 'notice', 'eviction', 'termination', 'appeal'];

        if (criticalTerms.some(t => descLower.includes(t))) {
            level = 'critical';
            score = 95;
        } else if (highTerms.some(t => descLower.includes(t))) {
            level = 'high';
            score = 80;
        }

        return { success: true, data: { urgencyLevel: level, urgencyScore: score } };
    },

    async logInteraction(userId, type, input, output, caseId = null) {
        try {
            await db.ref('aiLogs').push({
                userId, type, input, 
                output: typeof output === 'string' ? output.substring(0, 3000) : JSON.stringify(output).substring(0, 3000),
                caseId, createdAt: new Date().toISOString()
            });
        } catch (e) {}
    }
};

export default deepseekService;
