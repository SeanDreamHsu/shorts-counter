// AI Analyzer Service - Gemini Integration
// This module provides AI-powered content analysis using Gemini API

export interface AIAnalysisResult {
    summary: string;       // e.g., "You've been watching coding tutorials!"
    category: string;      // Learning | Gaming | Entertainment | Lifestyle | Brain Rot
    confidence: number;    // 0-1
    cached?: boolean;
}

// Simple in-memory cache
const analysisCache: Map<string, AIAnalysisResult> = new Map();

function getCacheKey(titles: string[]): string {
    return titles.slice(0, 20).join('|').slice(0, 500); // Limit key size
}

export async function analyzeWithGemini(
    titles: string[],
    apiKey: string
): Promise<AIAnalysisResult> {
    if (!apiKey || titles.length === 0) {
        return {
            summary: "No data to analyze",
            category: "Unknown",
            confidence: 0
        };
    }

    // Check cache
    const cacheKey = getCacheKey(titles);
    const cached = analysisCache.get(cacheKey);
    if (cached) {
        return { ...cached, cached: true };
    }

    // Prepare prompt
    const titlesText = titles.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join('\n');

    const prompt = `Analyze these short video titles and provide:
1. A brief, fun one-sentence summary of what the user has been watching (be casual and friendly)
2. The dominant content category (exactly one of: Learning, Gaming, Entertainment, Lifestyle, Brain Rot)

Video titles:
${titlesText}

Respond in this exact JSON format only, no other text:
{"summary": "your summary here", "category": "Category"}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('[AI Analyzer] API Error:', error);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const result: AIAnalysisResult = {
            summary: parsed.summary || "Interesting mix of content!",
            category: parsed.category || "Entertainment",
            confidence: 0.9
        };

        // Cache result
        analysisCache.set(cacheKey, result);

        return result;

    } catch (error) {
        console.error('[AI Analyzer] Error:', error);
        return {
            summary: "Couldn't analyze (check API key)",
            category: "Unknown",
            confidence: 0
        };
    }
}

// Clear cache (e.g., on new session)
export function clearAnalysisCache(): void {
    analysisCache.clear();
}
