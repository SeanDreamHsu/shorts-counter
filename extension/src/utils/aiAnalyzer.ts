// AI Analyzer Service - Extension Interface
// This module provides a stub for AI-powered content analysis
// Actual implementation coming soon - API integration pending

export interface AIAnalysisResult {
    summary: string;       // e.g., "You've been watching coding tutorials!"
    category: string;      // Learning | Gaming | Entertainment | Lifestyle | Brain Rot
    confidence: number;    // 0-1
    cached?: boolean;
}

export interface AIAnalyzerConfig {
    apiKey?: string;
    provider?: 'gemini' | 'openai' | 'custom';
    endpoint?: string;
}

// Stub implementation - returns placeholder until API is configured
export async function analyzeWithGemini(
    titles: string[],
    _apiKey: string
): Promise<AIAnalysisResult> {
    // Return placeholder - AI feature coming soon
    if (titles.length === 0) {
        return {
            summary: "No data to analyze",
            category: "Unknown",
            confidence: 0
        };
    }

    return {
        summary: "AI analysis coming soon! 🚀",
        category: "Pending",
        confidence: 0
    };
}

// Extension point for custom analyzer implementations
export type AnalyzerFunction = (titles: string[], config: AIAnalyzerConfig) => Promise<AIAnalysisResult>;

// Registry for custom analyzers (for future plugin support)
const analyzerRegistry: Map<string, AnalyzerFunction> = new Map();

export function registerAnalyzer(name: string, analyzer: AnalyzerFunction): void {
    analyzerRegistry.set(name, analyzer);
}

export function getAnalyzer(name: string): AnalyzerFunction | undefined {
    return analyzerRegistry.get(name);
}

// Clear cache (no-op for now, kept for API compatibility)
export function clearAnalysisCache(): void {
    // No-op
}
