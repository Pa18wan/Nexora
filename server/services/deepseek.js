import axios from 'axios';
import { db, generateId } from '../config/firebase.js';

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

class DeepSeekService {
    constructor() {
        this.client = axios.create({
            baseURL: DEEPSEEK_API_URL,
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Classify case into legal category
     */
    async classifyCase(caseDescription, additionalContext = {}) {
        const prompt = `You are a legal AI assistant. Analyze the following legal case description and classify it.

Case Description: ${caseDescription}
Location: ${additionalContext.location || 'Not specified'}
Category hint: ${additionalContext.category || 'Not specified'}

Provide your analysis in the following JSON format:
{
    "category": "One of: Criminal, Civil, Family, Property, Corporate, Tax, Labor, Consumer, Cyber, Constitutional, Other",
    "subcategory": "More specific category",
    "confidence": 0-100,
    "urgencyLevel": "One of: critical, high, medium, low",
    "urgencyScore": 0-100,
    "riskScore": 0-100,
    "requiredSpecialization": ["list of relevant legal specializations"],
    "reasoning": "Brief explanation of classification"
}`;

        try {
            const response = await this.chat(prompt);
            const parsed = this.parseJSON(response);

            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            console.error('Case classification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect urgency level of case
     */
    async detectUrgency(caseDescription, category) {
        const prompt = `You are a legal AI assistant. Analyze the urgency of the following legal case.

Case Description: ${caseDescription}
Category: ${category}

Consider factors like:
- Immediate legal deadlines
- Risk of harm or loss
- Time-sensitive matters
- Statute of limitations concerns

Provide your analysis in JSON format:
{
    "urgencyLevel": "One of: critical, high, medium, low",
    "urgencyScore": 0-100,
    "timeConstraints": ["list of time-sensitive factors"],
    "riskFactors": ["list of risk factors"],
    "recommendedAction": "immediate action recommendation",
    "reasoning": "explanation of urgency assessment"
}`;

        try {
            const response = await this.chat(prompt);
            const parsed = this.parseJSON(response);

            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            console.error('Urgency detection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate advocate matching based on case
     */
    async matchAdvocates(caseData, advocateProfiles) {
        const prompt = `You are a legal AI assistant. Match the following case with the most suitable advocates.

Case Details:
- Title: ${caseData.title}
- Description: ${caseData.description}
- Category: ${caseData.category}
- Location: ${caseData.location}
- Urgency: ${caseData.urgencyLevel || 'Not assessed'}

Available Advocates:
${advocateProfiles.map((a, i) => `
${i + 1}. ${a.name}
   - Specializations: ${a.specialization?.join(', ')}
   - Experience: ${a.experienceYears} years
   - Location: ${a.location?.city}
   - Success Rate: ${a.successRate}%
   - Rating: ${a.rating}/5
`).join('\n')}

Rank these advocates by suitability (1 = best match). Provide JSON:
{
    "rankings": [
        {
            "advocateIndex": 1,
            "matchScore": 0-100,
            "matchReasons": ["reason1", "reason2"],
            "concerns": ["any concerns"]
        }
    ],
    "topRecommendation": "Brief explanation of why the top advocate is best"
}`;

        try {
            const response = await this.chat(prompt);
            const parsed = this.parseJSON(response);

            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            console.error('Advocate matching error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * AI Chat assistant for legal queries - Enhanced with better context and suggestions
     */
    async legalChat(userMessage, caseContext = null, conversationHistory = []) {
        const systemPrompt = `You are Nexora AI, an intelligent legal assistant powered by advanced AI. Your role is to:

1. Provide comprehensive legal information, education, and guidance
2. Help users understand their legal situations with clear, actionable explanations
3. Explain legal procedures, terminology, and potential outcomes
4. Suggest practical next steps and strategies
5. Offer emotional support and empathy for stressful legal situations
6. Provide relevant legal precedents, timelines, and cost estimates where applicable
7. Recommend when to seek professional legal counsel

RESPONSE STYLE:
- Be warm, professional, and reassuring
- Use bullet points and structured formatting for clarity
- Include practical "Next Steps" at the end of longer responses
- When appropriate, mention relevant legal rights and protections
- Provide estimated timelines when discussing legal processes
- Suggest relevant documents the user should gather
- If the topic involves urgency, clearly communicate time-sensitive aspects

IMPORTANT RULES:
- NEVER provide specific legal advice that could be construed as attorney-client privilege
- Always recommend consulting a qualified advocate for specific matters
- Be empathetic and professional
- If asked about specific cases, provide general information only
- Clearly state you are an AI assistant, not a lawyer
- When unsure, say so clearly rather than guessing

${caseContext ? `
ACTIVE CASE CONTEXT:
- Title: ${caseContext.title || 'N/A'}
- Category: ${caseContext.category || 'N/A'}
- Status: ${caseContext.status || 'N/A'}
- Urgency Level: ${caseContext.urgencyLevel || 'N/A'}
- Description: ${caseContext.description ? caseContext.description.substring(0, 500) : 'N/A'}
${caseContext.aiAnalysis ? `- AI Analysis: ${JSON.stringify(caseContext.aiAnalysis).substring(0, 300)}` : ''}

Use this case context to provide more relevant and specific guidance.` : ''}

When the user asks a general question without case context, provide helpful legal education and suggest they can create a case for more personalized assistance.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10),
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await this.chatWithMessages(messages);

            // Generate suggested follow-up questions
            const suggestions = this.generateSuggestions(userMessage, caseContext);

            return {
                success: true,
                data: {
                    response: response,
                    suggestions,
                    disclaimer: 'This is general information only and does not constitute legal advice. Please consult a qualified legal professional for advice specific to your situation.'
                }
            };
        } catch (error) {
            console.error('AI Chat error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate contextual follow-up suggestions
     */
    generateSuggestions(userMessage, caseContext) {
        const messageLower = userMessage.toLowerCase();
        const suggestions = [];

        if (messageLower.includes('evict') || messageLower.includes('tenant') || messageLower.includes('landlord')) {
            suggestions.push('What are my rights as a tenant?', 'How long does the eviction process take?', 'What documents do I need?');
        } else if (messageLower.includes('divorce') || messageLower.includes('custody') || messageLower.includes('marriage')) {
            suggestions.push('What is the divorce process?', 'How is child custody determined?', 'What about property division?');
        } else if (messageLower.includes('injury') || messageLower.includes('accident') || messageLower.includes('damage')) {
            suggestions.push('How do I file an insurance claim?', 'What compensation can I expect?', 'Is there a statute of limitations?');
        } else if (messageLower.includes('contract') || messageLower.includes('agreement') || messageLower.includes('breach')) {
            suggestions.push('What constitutes a breach of contract?', 'What are my legal remedies?', 'Can I terminate this contract?');
        } else if (messageLower.includes('criminal') || messageLower.includes('arrest') || messageLower.includes('charge')) {
            suggestions.push('What are my rights during arrest?', 'Do I need a criminal lawyer?', 'What is the bail process?');
        } else if (messageLower.includes('property') || messageLower.includes('land') || messageLower.includes('real estate')) {
            suggestions.push('How do I verify property ownership?', 'What is the registration process?', 'What about property disputes?');
        } else if (caseContext) {
            suggestions.push(
                `What should I do next for my ${caseContext.category || ''} case?`,
                'What documents should I prepare?',
                'How long will this process take?'
            );
        } else {
            suggestions.push(
                'What type of lawyer do I need?',
                'How much does legal representation cost?',
                'What are my legal rights?'
            );
        }

        return suggestions.slice(0, 3);
    }

    /**
     * Analyze document content
     */
    async analyzeDocument(documentText, documentType) {
        const prompt = `You are a legal document analysis AI. Analyze the following ${documentType || 'legal document'}:

${documentText.substring(0, 4000)}

Provide analysis in JSON format:
{
    "documentType": "type of document identified",
    "keyPoints": ["list of key points"],
    "parties": ["parties mentioned"],
    "dates": ["important dates mentioned"],
    "obligations": ["legal obligations mentioned"],
    "risks": ["potential legal risks identified"],
    "recommendations": ["recommendations for the client"],
    "summary": "brief summary of the document"
}`;

        try {
            const response = await this.chat(prompt);
            const parsed = this.parseJSON(response);

            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            console.error('Document analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Core chat method
     */
    async chat(prompt) {
        return this.chatWithMessages([
            { role: 'user', content: prompt }
        ]);
    }

    /**
     * Chat with full message history
     */
    async chatWithMessages(messages) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            // Fallback for development/testing when API key is missing
            if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-api-key') {
                return this.getMockResponse(messages);
            }
            throw error;
        }
    }

    /**
     * Parse JSON from AI response
     */
    parseJSON(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { raw: response };
        } catch (error) {
            return { raw: response, parseError: true };
        }
    }

    /**
     * Enhanced mock responses for development
     */
    getMockResponse(messages) {
        const lastMessage = messages[messages.length - 1].content.toLowerCase();

        if (lastMessage.includes('classify') || lastMessage.includes('category') || lastMessage.includes('analyze the following legal case')) {
            return JSON.stringify({
                category: 'Property',
                subcategory: 'Land Dispute',
                confidence: 85,
                urgencyLevel: 'medium',
                urgencyScore: 65,
                riskScore: 55,
                requiredSpecialization: ['Property Law', 'Civil Law'],
                reasoning: 'Based on the description involving property boundaries and ownership.'
            });
        }

        if (lastMessage.includes('urgency')) {
            return JSON.stringify({
                urgencyLevel: 'medium',
                urgencyScore: 65,
                timeConstraints: ['Property registration deadline approaching'],
                riskFactors: ['Potential encroachment', 'Documentation gaps'],
                recommendedAction: 'Consult with a property lawyer within the next 2 weeks',
                reasoning: 'While not immediately critical, delays could complicate the case.'
            });
        }

        if (lastMessage.includes('match') || lastMessage.includes('advocate')) {
            return JSON.stringify({
                rankings: [
                    { advocateIndex: 0, matchScore: 95, matchReasons: ['Expert in property law', 'Local jurisdiction experience'], concerns: [] },
                    { advocateIndex: 1, matchScore: 82, matchReasons: ['Good success rate', 'Available immediately'], concerns: ['Less experience in this area'] }
                ],
                topRecommendation: 'First advocate has extensive property law experience in your jurisdiction.'
            });
        }

        // Enhanced conversational responses
        if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
            return `Hello! 👋 I'm Nexora AI, your legal intelligence assistant. I'm here to help you understand legal matters, guide you through processes, and provide general legal information.

**Here's how I can help you:**
- 📋 Explain legal concepts and procedures
- ⚖️ Help you understand your legal rights
- 📝 Guide you on what documents to prepare
- 🔍 Analyze your legal situation (general guidance)
- 👨‍⚖️ Help you find the right type of lawyer

What legal matter can I assist you with today?`;
        }

        if (lastMessage.includes('evict') || lastMessage.includes('tenant') || lastMessage.includes('rent')) {
            return `I understand you're dealing with a tenancy/rental matter. Here's some general guidance:

**Key Points to Consider:**
- 📜 Your rental/lease agreement is the primary document governing your rights
- ⏰ Most jurisdictions require written notice before eviction proceedings
- 🏛️ Eviction typically requires a court order — self-help eviction is usually illegal
- 📋 Both tenants and landlords have specific rights and obligations

**Common Tenant Rights:**
- Right to habitable premises
- Right to proper notice before termination
- Protection against retaliatory eviction
- Right to security deposit return

**Suggested Next Steps:**
1. Review your rental/lease agreement carefully
2. Document all communications with your landlord
3. Gather proof of rent payments
4. Consult with a housing/property lawyer for specific advice

Would you like to know more about any of these points, or would you like to create a case for more detailed assistance?`;
        }

        if (lastMessage.includes('divorce') || lastMessage.includes('custody') || lastMessage.includes('separation')) {
            return `I understand you're going through a family law matter. Here's some helpful information:

**Divorce/Separation Overview:**
- 📝 Filing requirements vary by jurisdiction (residency requirements, cooling-off periods)
- 💰 Property division can be contested or uncontested
- 👶 Child custody is determined based on "best interest of the child"
- 📋 Alimony/maintenance depends on multiple factors

**Key Considerations:**
- **Property**: Joint vs. separate property classification
- **Children**: Custody arrangements (physical vs. legal custody)
- **Finances**: Division of assets, debts, and ongoing support
- **Timeline**: Typically 6-18 months depending on complexity

**Suggested Next Steps:**
1. Gather financial documents (bank statements, tax returns, property deeds)
2. List all joint and individual assets
3. Consider mediation before litigation
4. Consult with a family law advocate

Would you like more specific guidance on any of these areas?`;
        }

        // Default intelligent response
        return `Thank you for your question. I'd be happy to help you understand this legal matter better.

**General Guidance:**
Based on your query, here are some important considerations:

1. **Understanding Your Situation**: Every legal matter has specific procedures and timelines. It's important to understand which area of law applies to your situation.

2. **Document Everything**: Keep records of all relevant communications, agreements, and transactions related to your matter.

3. **Know Your Rights**: Indian law provides various protections depending on the nature of your legal issue. Understanding your fundamental rights is crucial.

4. **Time-Sensitive Matters**: Many legal actions have limitation periods (deadlines). Acting promptly can be crucial.

**Recommended Actions:**
- 📝 Write down all the facts of your situation clearly
- 📁 Organize relevant documents and evidence
- 📅 Note any important dates or deadlines
- 👨‍⚖️ Consider consulting with a qualified advocate for personalized advice

You can create a new case on our platform for AI-powered analysis of your specific situation, or feel free to ask me more specific questions about your legal matter.

*Please remember: This is general legal information, not specific legal advice. For advice tailored to your situation, please consult a qualified legal professional.*`;
    }

    /**
     * Log AI interaction to Firestore
     */
    async logInteraction(userId, type, input, output, caseId = null) {
        try {
            if (!db) {
                console.warn('Firestore not available, skipping AI log');
                return;
            }

            await db.collection('aiLogs').doc(generateId()).set({
                userId,
                caseId: caseId || null,
                type,
                input: typeof input === 'string' ? input : JSON.stringify(input),
                output: typeof output === 'string' ? output : JSON.stringify(output),
                model: 'deepseek-chat',
                tokensUsed: 0,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to log AI interaction:', error);
        }
    }
}

export default new DeepSeekService();
