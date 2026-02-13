import axios from 'axios';
import AILog from '../models/AILog.js';

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

Provide your analysis in the following JSON format:
{
    "category": "One of: Criminal, Civil, Family, Property, Corporate, Tax, Labor, Consumer, Cyber, Constitutional, Other",
    "subcategory": "More specific category",
    "confidence": 0-100,
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
     * AI Chat assistant for legal queries
     */
    async legalChat(userMessage, caseContext = null, conversationHistory = []) {
        const systemPrompt = `You are Nexora AI, a helpful legal assistant. Your role is to:
1. Provide general legal information and education
2. Help users understand their legal situations
3. Explain legal procedures and terminology
4. Guide users on next steps

IMPORTANT RULES:
- NEVER provide specific legal advice
- Always recommend consulting a qualified advocate for specific matters
- Be empathetic and professional
- If asked about specific cases, provide general information only
- Clearly state you are an AI assistant, not a lawyer

${caseContext ? `\nCase Context:\nCategory: ${caseContext.category}\nStatus: ${caseContext.status}` : ''}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10), // Last 10 messages for context
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await this.chatWithMessages(messages);

            return {
                success: true,
                data: {
                    response: response,
                    disclaimer: 'This is general information only and does not constitute legal advice.'
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
     * Analyze document content (OCR/text extraction assumed done)
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
            // Fallback for development/testing
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
            // Try to extract JSON from the response
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
     * Mock responses for development
     */
    getMockResponse(messages) {
        const lastMessage = messages[messages.length - 1].content.toLowerCase();

        if (lastMessage.includes('classify') || lastMessage.includes('category')) {
            return JSON.stringify({
                category: 'Property',
                subcategory: 'Land Dispute',
                confidence: 85,
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

        return 'I understand your concern. Based on my analysis, I recommend consulting with a qualified legal professional who can review your specific situation in detail. Would you like me to explain any legal concepts or procedures that might help you understand your situation better?';
    }

    /**
     * Log AI interaction
     */
    async logInteraction(userId, type, input, output, caseId = null) {
        try {
            await AILog.create({
                userId,
                caseId,
                type,
                input: typeof input === 'string' ? input : JSON.stringify(input),
                output: typeof output === 'string' ? output : JSON.stringify(output),
                model: 'deepseek-chat',
                tokensUsed: 0 // Would be from actual API response
            });
        } catch (error) {
            console.error('Failed to log AI interaction:', error);
        }
    }
}

export default new DeepSeekService();
