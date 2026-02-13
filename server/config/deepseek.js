import axios from 'axios';

const deepseekClient = axios.create({
    baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

deepseekClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        throw error;
    }
);

export const analyzeCase = async (caseData) => {
    const { title, description, category } = caseData;

    const prompt = `You are an expert legal analyst AI. Analyze the following legal case and provide a structured assessment.

Case Title: ${title}
Description: ${description}
Category: ${category || 'Not specified'}

Analyze and respond with ONLY a JSON object (no markdown, no code blocks) containing:
{
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "riskScore": (number 1-100),
  "caseType": "string describing specific case type",
  "requiredSpecialization": ["array of required legal specializations"],
  "estimatedDuration": "string like '2-3 months'",
  "keyIssues": ["array of key legal issues identified"],
  "recommendedActions": ["array of immediate actions to take"],
  "reasoning": "brief explanation of the analysis"
}`;

    try {
        const response = await deepseekClient.post('/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are a legal analysis AI. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const content = response.data.choices[0].message.content;
        const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        return analysis;
    } catch (error) {
        console.error('Case analysis failed:', error.message);
        return {
            urgencyLevel: 'medium',
            riskScore: 50,
            caseType: category || 'General Legal Matter',
            requiredSpecialization: ['General Practice'],
            estimatedDuration: '1-3 months',
            keyIssues: ['Requires manual review'],
            recommendedActions: ['Consult with a legal professional'],
            reasoning: 'AI analysis unavailable, default assessment provided'
        };
    }
};

export const matchAdvocates = async (caseAnalysis, advocates) => {
    const prompt = `You are a legal advocate matching system. Given a case analysis and a list of advocates, rank the advocates by suitability.

Case Analysis:
${JSON.stringify(caseAnalysis, null, 2)}

Available Advocates:
${JSON.stringify(advocates.map(a => ({
        id: a._id,
        name: a.userId?.name || 'Unknown',
        specialization: a.specialization,
        experience: a.experienceYears,
        successRate: a.successRate,
        rating: a.rating
    })), null, 2)}

Respond with ONLY a JSON array of advocate IDs ranked by suitability with match scores:
[
  { "advocateId": "id", "matchScore": 95, "reason": "brief reason" }
]`;

    try {
        const response = await deepseekClient.post('/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are an advocate matching AI. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 500
        });

        const content = response.data.choices[0].message.content;
        return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
        console.error('Advocate matching failed:', error.message);
        return advocates.map((a, i) => ({
            advocateId: a._id,
            matchScore: 80 - (i * 5),
            reason: 'Default matching applied'
        }));
    }
};

export const chatAssistant = async (messages, context = {}) => {
    const systemPrompt = `You are a helpful legal assistant AI for the Legal Services Platform. 
You provide general legal information and guidance. 
Important: Always remind users that your responses are informational only and not legal advice.
Current context: ${JSON.stringify(context)}`;

    try {
        const response = await deepseekClient.post('/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Chat assistant failed:', error.message);
        return 'I apologize, but I am currently unable to process your request. Please try again later or contact support.';
    }
};

export default deepseekClient;
