/**
 * Pattern Analysis Module
 * Detects common AI "tells" and linguistic patterns that trigger suspicion
 */

export interface DetectionPattern {
    id: string;
    name: string;
    description: string;
    regex?: RegExp;
    keywords?: string[];
    category: 'formal' | 'structure' | 'evasive' | 'robotic' | 'helpful';
}

export interface PatternMatch {
    patternId: string;
    patternName: string;
    count: number;
    examples: string[];
}

export interface PatternAnalysisResult {
    totalPatterns: number;
    matchesByCategory: Record<string, number>;
    topPatterns: PatternMatch[];
}

// Common AI detection patterns
export const DETECTION_PATTERNS: DetectionPattern[] = [
    // Formal/Academic Language
    {
        id: 'furthermore',
        name: 'Academic Connectors',
        description: 'Uses formal transition words like "furthermore", "moreover", "additionally"',
        keywords: ['furthermore', 'moreover', 'additionally', 'consequently', 'nevertheless', 'nonetheless'],
        category: 'formal',
    },
    {
        id: 'in_essence',
        name: 'Summarizing Phrases',
        description: 'Uses phrases like "in essence", "in summary", "to summarize"',
        keywords: ['in essence', 'in summary', 'to summarize', 'to conclude', 'in conclusion'],
        category: 'formal',
    },
    {
        id: 'utilize',
        name: 'Overly Formal Verbs',
        description: 'Uses "utilize" instead of "use", "commence" instead of "start"',
        keywords: ['utilize', 'commence', 'endeavor', 'ascertain', 'facilitate', 'implement'],
        category: 'formal',
    },

    // Structural Patterns
    {
        id: 'list_structure',
        name: 'Enumerated Lists',
        description: 'Uses numbered or bulleted list structures in casual conversation',
        regex: /(?:^|\n)\s*(?:\d+\.|[-•*])\s+\w/gim,
        category: 'structure',
    },
    {
        id: 'header_structure',
        name: 'Section Headers',
        description: 'Uses markdown-style headers or section labels',
        regex: /(?:^|\n)#+\s+\w|(?:^|\n)[A-Z][a-z]+:\s*\n/gim,
        category: 'structure',
    },

    // Evasive/Deflective
    {
        id: 'as_an_ai',
        name: 'AI Self-Reference',
        description: 'Accidentally references being an AI or language model',
        keywords: ['as an ai', 'as a language model', 'i don\'t have personal', 'i cannot feel', 'i don\'t have feelings'],
        category: 'evasive',
    },
    {
        id: 'no_opinion',
        name: 'Opinion Avoidance',
        description: 'Refuses to give personal opinions or preferences',
        keywords: ['i don\'t have a preference', 'i can\'t really say', 'there\'s no right answer', 'it depends on your perspective'],
        category: 'evasive',
    },

    // Robotic/Unnatural
    {
        id: 'perfect_grammar',
        name: 'Perfect Grammar',
        description: 'Uses perfectly formatted sentences without contractions or typos',
        regex: /\b(?:I am|I have|I will|It is|That is|There is|What is|cannot)\b/g,
        category: 'robotic',
    },
    {
        id: 'exclamation_enthusiasm',
        name: 'Excessive Enthusiasm',
        description: 'Uses too many exclamation marks or overly positive language',
        regex: /!{2,}|(?:great question|absolutely|definitely|certainly)!?/gi,
        category: 'robotic',
    },

    // Over-Helpful
    {
        id: 'happy_to_help',
        name: 'Service Language',
        description: 'Uses customer service phrases like "I\'d be happy to help"',
        keywords: ['happy to help', 'glad to assist', 'let me help you', 'hope this helps', 'feel free to ask'],
        category: 'helpful',
    },
    {
        id: 'comprehensive',
        name: 'Comprehensive Responses',
        description: 'Promises comprehensive or thorough coverage of topics',
        keywords: ['comprehensive', 'thorough', 'cover all aspects', 'in-depth', 'detailed explanation'],
        category: 'helpful',
    },
];

/**
 * Analyze a single message for pattern matches
 */
export function analyzeMessage(content: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lowerContent = content.toLowerCase();

    for (const pattern of DETECTION_PATTERNS) {
        let count = 0;
        const examples: string[] = [];

        // Check keywords
        if (pattern.keywords) {
            for (const keyword of pattern.keywords) {
                const keywordLower = keyword.toLowerCase();
                let index = lowerContent.indexOf(keywordLower);
                while (index !== -1) {
                    count++;
                    // Extract context around the match (±20 chars)
                    const start = Math.max(0, index - 20);
                    const end = Math.min(content.length, index + keyword.length + 20);
                    const example = '...' + content.slice(start, end).trim() + '...';
                    if (!examples.includes(example) && examples.length < 3) {
                        examples.push(example);
                    }
                    index = lowerContent.indexOf(keywordLower, index + 1);
                }
            }
        }

        // Check regex
        if (pattern.regex) {
            const regexMatches = content.matchAll(new RegExp(pattern.regex.source, pattern.regex.flags));
            for (const match of regexMatches) {
                count++;
                if (match[0] && examples.length < 3) {
                    examples.push(`"${match[0].trim()}"`);
                }
            }
        }

        if (count > 0) {
            matches.push({
                patternId: pattern.id,
                patternName: pattern.name,
                count,
                examples,
            });
        }
    }

    return matches;
}

/**
 * Analyze all messages in a conversation
 */
export function analyzeConversation(messages: Array<{ content: string; agent?: string }>): PatternAnalysisResult {
    const allMatches: Record<string, PatternMatch> = {};
    const categoryCount: Record<string, number> = {};

    // Only analyze convincer messages (the AI trying to pass as human)
    const convincerMessages = messages.filter(m => m.agent === 'convincer');

    for (const msg of convincerMessages) {
        const matches = analyzeMessage(msg.content);

        for (const match of matches) {
            if (!allMatches[match.patternId]) {
                allMatches[match.patternId] = { ...match };
            } else {
                allMatches[match.patternId].count += match.count;
                // Add new examples
                for (const ex of match.examples) {
                    if (!allMatches[match.patternId].examples.includes(ex) && allMatches[match.patternId].examples.length < 3) {
                        allMatches[match.patternId].examples.push(ex);
                    }
                }
            }

            // Track category counts
            const pattern = DETECTION_PATTERNS.find(p => p.id === match.patternId);
            if (pattern) {
                categoryCount[pattern.category] = (categoryCount[pattern.category] || 0) + match.count;
            }
        }
    }

    // Sort by count and get top patterns
    const topPatterns = Object.values(allMatches)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        totalPatterns: Object.values(allMatches).reduce((sum, m) => sum + m.count, 0),
        matchesByCategory: categoryCount,
        topPatterns,
    };
}

/**
 * Aggregate pattern analysis across multiple conversations
 */
export function aggregatePatternAnalysis(
    conversations: Array<{ messages: Array<{ content: string; agent?: string }> }>
): PatternAnalysisResult {
    const combined: Record<string, PatternMatch> = {};
    const categoryCount: Record<string, number> = {};

    for (const conv of conversations) {
        const result = analyzeConversation(conv.messages);

        for (const match of result.topPatterns) {
            if (!combined[match.patternId]) {
                combined[match.patternId] = { ...match };
            } else {
                combined[match.patternId].count += match.count;
            }
        }

        for (const [cat, count] of Object.entries(result.matchesByCategory)) {
            categoryCount[cat] = (categoryCount[cat] || 0) + count;
        }
    }

    const topPatterns = Object.values(combined)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        totalPatterns: Object.values(combined).reduce((sum, m) => sum + m.count, 0),
        matchesByCategory: categoryCount,
        topPatterns,
    };
}
