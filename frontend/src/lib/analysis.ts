import { Groq } from 'groq-sdk';
import { Applicant } from './interfaces/applicant';
import { CvData } from './interfaces/cv';
import { LinkedInData } from './interfaces/applicant';
import { LeetCodeData } from './interfaces/leetcode';
import { GitHubData } from './interfaces/github';
import { AnalysisResult } from './interfaces/analysis';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Options ──────────────────────────────────────────────────────────────────
export interface AnalysisOptions {
  /** Custom detection prompt from the user's active preset */
  detectionPrompt?: string;
  /** Per-user scoring weights (keys match analysis dimensions, values 0-100) */
  customWeights?: Record<string, number>;
}

/**
 * Count available data sources for an applicant
 */
function countAvailableDataSources(applicant: Applicant): number {
  return [
    applicant.cv_data,
    applicant.li_data,
    applicant.gh_data,
    applicant.lc_data
  ].filter(Boolean).length;
}

/**
 * Create a fallback analysis result when insufficient data is available
 */
function createInsufficientDataFallback(applicantId: string, availableDataSources: number): AnalysisResult {
  return {
    score: 50,
    summary: availableDataSources === 0
      ? 'No data sources available for credibility analysis.'
      : 'Analysis completed with limited data sources.',
    flags: [{
      type: 'yellow',
      category: 'verification',
      message: availableDataSources === 0
        ? 'No data sources (CV, LinkedIn, GitHub, or LeetCode) available for analysis.'
        : `Analysis performed with ${availableDataSources}/4 data sources. Additional sources would improve accuracy.`,
      severity: availableDataSources === 0 ? 5 : 3
    }],
    suggestedQuestions: availableDataSources === 0
      ? ['Could you provide a CV, LinkedIn profile, or GitHub profile for analysis?']
      : ['Could you provide additional information sources (CV, LinkedIn, or GitHub) to improve analysis accuracy?'],
    analysisDate: new Date().toISOString(),
    sources: []
  };
}

/**
 * Create an error fallback analysis result
 */
export function createErrorFallback(error?: string): AnalysisResult {
  return {
    score: 50,
    summary: 'Analysis could not be completed due to technical error.',
    flags: [{
      type: 'yellow',
      category: 'verification',
      message: 'Analysis could not be completed due to technical error',
      severity: 5
    }],
    suggestedQuestions: ['Could you provide additional information about your background?'],
    analysisDate: new Date().toISOString(),
    sources: [],
    ...(error && { error })
  };
}

/**
 * Main analysis function that performs comprehensive credibility analysis in a single call
 */
export async function analyzeApplicant(applicant: Applicant, options?: AnalysisOptions): Promise<Applicant> {
  console.log(`Starting comprehensive analysis for applicant ${applicant.id}`);

  try {
    // Count available data sources
    const availableDataSources = countAvailableDataSources(applicant);

    // Run analysis even with just one data source
    if (availableDataSources === 0) {
      console.log(`No data sources available for applicant ${applicant.id}. Cannot perform analysis.`);

      // Return applicant with no data fallback
      return {
        ...applicant,
        ai_data: createInsufficientDataFallback(applicant.id, availableDataSources),
        score: 50
      };
    }

    const analysisResult = await performComprehensiveAnalysis(
      applicant.cv_data || undefined,
      applicant.li_data || undefined,
      applicant.gh_data || undefined,
      applicant.lc_data || undefined,
      applicant.name,
      applicant.email || undefined,
      undefined, // role field doesn't exist in new model
      options,
    );

    // Apply custom scoring weights if provided
    const finalScore = options?.customWeights
      ? applyCustomWeights(analysisResult.score, analysisResult, options.customWeights)
      : analysisResult.score;

    // Update applicant with analysis results
    return {
      ...applicant,
      ai_data: { ...analysisResult, score: finalScore },
      score: finalScore
    };
  } catch (error) {
    console.error(`Error during analysis for applicant ${applicant.id}:`, error);

    // Return applicant with basic analysis indicating error
    return {
      ...applicant,
      ai_data: createErrorFallback(error instanceof Error ? error.message : undefined),
      score: 50
    };
  }
}

/**
 * Apply custom scoring weights to adjust the final credibility score.
 */
function applyCustomWeights(
  baseScore: number,
  _result: AnalysisResult,
  weights: Record<string, number>
): number {
  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  if (!totalWeight) return baseScore;
  const cvWeight = (weights['cv_accuracy'] ?? 30) / totalWeight;
  const consistencyWeight = (weights['consistency'] ?? 25) / totalWeight;
  const boostFactor = 1 + (cvWeight + consistencyWeight - 0.55) * 0.2;
  return Math.max(0, Math.min(100, Math.round(baseScore * boostFactor)));
}

/**
 * Analyzes a single data source (CV, LinkedIn, or GitHub) in isolation.
 * This is the "map" step of the analysis.
 */
async function analyzeSingleSource(
  sourceType: 'cv' | 'linkedin' | 'github' | 'leetcode',
  data: CvData | LinkedInData | GitHubData | LeetCodeData,
  name?: string
): Promise<{ summary: string; flags: any[]; score: number }> {
  const prompt = `
You are a credibility-checking assistant. Your task is to analyze a single data source for a candidate and provide a summary, a credibility score (0-100), and any potential flags.

**Candidate Name:** ${name || 'Not provided'}
**Data Source Type:** ${sourceType.toUpperCase()}

**Data:**
${JSON.stringify(data)}

**Your Tasks:**
1.  Analyze the provided ${sourceType.toUpperCase()} data for signs of authenticity and professionalism.
2.  Identify any red or yellow flags (e.g., inconsistencies, low-quality content, fake-looking profile).
3.  Provide a credibility score for this specific data source (0-100).
4.  Write a concise summary of your findings.

**Output Format:**
Return a JSON object with:
{
  "score": 0-100,
  "summary": "1-2 sentence summary of this source.",
  "flags": [{"type": "red"|"yellow", "category": "...", "message": "...", "severity": 1-10}]
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      summary: result.summary || `No summary could be generated for the ${sourceType.toUpperCase()}.`,
      flags: result.flags || [],
      score: result.score || 50,
    };
  } catch (error) {
    console.error(`Analysis failed for source ${sourceType}:`, error);
    return {
      summary: `Analysis of the ${sourceType.toUpperCase()} failed due to a technical error.`,
      flags: [{
        type: 'yellow',
        category: 'system',
        message: `The ${sourceType.toUpperCase()} analysis could not be completed.`,
        severity: 5
      }],
      score: 50,
    };
  }
}


/**
 * Perform comprehensive credibility analysis in a single call
 */
async function performComprehensiveAnalysis(
  cvData?: CvData,
  linkedinData?: LinkedInData,
  githubData?: GitHubData,
  leetcodeData?: LeetCodeData,
  name?: string,
  email?: string,
  role?: string,
  options?: AnalysisOptions,
): Promise<AnalysisResult> {
  // 1. "Map" Step: Analyze each source individually and in parallel
  const analysisPromises = [];
  if (cvData) {
    analysisPromises.push(analyzeSingleSource('cv', cvData, name).then(res => ({ type: 'cv', ...res })));
  }
  if (linkedinData) {
    analysisPromises.push(analyzeSingleSource('linkedin', linkedinData, name).then(res => ({ type: 'linkedin', ...res })));
  }
  if (githubData) {
    analysisPromises.push(analyzeSingleSource('github', githubData, name).then(res => ({ type: 'github', ...res })));
  }
  if (leetcodeData) {
    analysisPromises.push(analyzeSingleSource('leetcode', leetcodeData, name).then(res => ({ type: 'leetcode', ...res })));
  }

  const individualAnalyses = await Promise.all(analysisPromises);

  // 2. "Reduce" Step: Create a final prompt with the summaries of each analysis
  const customRulesSection = options?.detectionPrompt
    ? `\n**Custom Detection Rules (user-configured):**\n${options.detectionPrompt}\n\nApply these rules in addition to the standard credibility checks above. Flag anything that violates these rules.\n`
    : '';

  const prompt = `
You are a credibility-checking assistant inside HireSense, a tool used by hiring managers to verify whether candidates are being honest and consistent in their job applications.

Your job is to review pre-analyzed summaries from different data sources (CV, LinkedIn, GitHub) and produce a final, unified credibility assessment. You are not scoring technical ability — only consistency and believability based on the data summaries provided. LeetCode data is particularly useful for verifying algorithmic proficiency and problem-solving consistency.

**Candidate Information:**
- Name: ${name || 'Not provided'}
- Email: ${email || 'Not provided'}
- Role: ${role || 'Not specified'}

**Individual Analysis Summaries:**

${individualAnalyses.length > 0 ? individualAnalyses.map(analysis => `
**Source: ${analysis.type.toUpperCase()}**
- **Credibility Score:** ${analysis.score}
- **Summary:** ${analysis.summary}
- **Flags:** ${analysis.flags.length > 0 ? analysis.flags.map((f: { type: string; message: string }) => `(${f.type}) ${f.message}`).join(', ') : 'None'}
`).join('') : 'No analysis summaries were generated.'}

${linkedinData?.isDummyData ? '⚠️ **IMPORTANT**: LinkedIn data is simulated for testing purposes. Do not treat name mismatches as red flags.' : ''}
${customRulesSection}
**Your Tasks:**

1. **Synthesize Findings:** Based *only* on the summaries provided, create a final, overall credibility score and a concise summary.
2. **Cross-Reference:** Look for inconsistencies *between* the summaries. For example, if the CV summary mentions a job that the LinkedIn summary doesn't, that's a flag.
3. **Aggregate Flags:** Combine flags from individual analyses and add new ones for any cross-source inconsistencies you find.
4. **Suggest Questions:** Based on the combined findings and any inconsistencies, suggest 1-3 clarifying questions to ask the candidate.

**Scoring Guidelines:**
- 90-100: Highly credible, minimal concerns
- 70-89: Generally credible with minor concerns
- 50-69: Moderate concerns, requires attention
- 30-49: Significant red flags, requires investigation
- 0-29: High risk, major credibility issues

**Output Format:**

Return a JSON object with:
{
  "score": 0-100,
  "summary": "1-2 sentence judgment",
  "flags": [{"type": "red"|"yellow", "category": "consistency"|"verification"|"authenticity"|"activity", "message": "specific concern", "severity": 1-10}],
  "suggestedQuestions": ["array of clarifying questions to ask the candidate"]
}

Be objective. Do not make assumptions. Only work with the summaries provided.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      score: result.score || 50,
      summary: result.summary || 'Analysis completed with available data.',
      flags: (result.flags || []).map((flag: Record<string, unknown>) => ({
        type: flag.type === 'red' || flag.type === 'yellow' ? flag.type : 'yellow',
        category: flag.category || 'verification',
        message: flag.message || 'Analysis concern detected',
        severity: typeof flag.severity === 'number' ? Math.max(1, Math.min(10, flag.severity)) : 5
      })),
      suggestedQuestions: result.suggestedQuestions || [],
      analysisDate: new Date().toISOString(),
      sources: (individualAnalyses as unknown as import('./interfaces/analysis').AnalysisSource[]),
    };
  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    return {
      score: 50,
      summary: 'Analysis could not be completed due to technical error.',
      flags: [{ type: 'yellow', category: 'verification', message: 'Analysis system temporarily unavailable', severity: 5 }],
      suggestedQuestions: ['Could you provide additional information about your background?'],
      analysisDate: new Date().toISOString(),
      sources: []
    };
  }
}
