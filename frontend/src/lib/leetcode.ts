import { LeetCodeData, LeetCodeSubmission } from './interfaces/leetcode';

/**
 * Extract LeetCode username from URL
 */
export function extractLeetCodeUsername(url: string): string {
    if (!url) return '';

    // Clean up the URL: remove protocol, www, and whitespace
    let cleanUrl = url.trim().replace(/^(https?:\/\/)?(www\.)?/, '');

    // Try to match patterns like leetcode.com/u/username or leetcode.com/username
    const patterns = [
        /leetcode\.com\/u\/([^/?#]+)/i,
        /leetcode\.com\/(?!u\/)([^/?#]+)/i,
        /^([^/]+)$/
    ];

    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1] && match[1].toLowerCase() !== 'undefined') {
            return match[1];
        }
    }

    // Default fallback: if it's not a URL, it might be the username itself
    if (!cleanUrl.includes('/') && cleanUrl.toLowerCase() !== 'undefined') {
        return cleanUrl;
    }

    return '';
}

/**
 * Fetch LeetCode data from unofficial public API
 */
export async function fetchLeetCodeProfile(username: string): Promise<LeetCodeData> {
    const baseUrl = process.env.NEXT_PUBLIC_LEETCODE_API_URL || 'https://alfa-leetcode-api.onrender.com';

    if (!username || username.toLowerCase() === 'undefined') {
        throw new Error('A valid LeetCode username is required');
    }

    try {
        console.log(`📡 Fetching LeetCode profile for: ${username}`);

        // Fetch multiple endpoints to construct a full profile
        const [profileRes, solvedRes, contestRes, submissionRes] = await Promise.all([
            fetch(`${baseUrl}/${username}`).then(res => res.json()),
            fetch(`${baseUrl}/${username}/solved`).then(res => res.json()),
            fetch(`${baseUrl}/${username}/contest`).then(res => res.json()),
            fetch(`${baseUrl}/${username}/submission`).then(res => res.json())
        ]);

        console.log(`📡 LeetCode Raw Profile Response for ${username}:`, JSON.stringify(profileRes).substring(0, 200));

        if (profileRes.errors || profileRes.message === "User not found") {
            throw new Error(`LeetCode user '${username}' not found`);
        }

        // Use the username from the API if available, otherwise fallback to the provided one
        const officialUsername = profileRes.username || username;

        // Safer JSON parse for submissionCalendar (might be string or object)
        let subCalendar = {};
        try {
            if (typeof profileRes.submissionCalendar === 'string') {
                subCalendar = JSON.parse(profileRes.submissionCalendar || '{}');
            } else if (typeof profileRes.submissionCalendar === 'object') {
                subCalendar = profileRes.submissionCalendar || {};
            }
        } catch (e) {
            console.error('Error parsing submission calendar:', e);
        }

        // Transform and merge data
        const data: LeetCodeData = {
            username: officialUsername,
            name: profileRes.realName || profileRes.username || officialUsername,
            avatar: profileRes.avatar || '',
            ranking: profileRes.ranking || 0,
            reputation: profileRes.reputation || 0,
            totalSolved: solvedRes.solvedProblem || solvedRes.totalSolved || 0,
            totalQuestions: solvedRes.totalQuestions || 0,
            easySolved: solvedRes.easySolved || 0,
            mediumSolved: solvedRes.mediumSolved || 0,
            hardSolved: solvedRes.hardSolved || 0,
            acceptanceRate: solvedRes.acceptanceRate || 0,
            contributionPoints: profileRes.contributionPoints || 0,
            badges: (profileRes.badges || []).map((b: any) => ({
                name: b.name,
                icon: b.icon ? (b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`) : ''
            })),
            submissionCalendar: subCalendar,
            recentSubmissions: (submissionRes.submission || []).map((s: any) => ({
                title: s.title,
                titleSlug: s.titleSlug,
                timestamp: s.timestamp,
                statusDisplay: s.statusDisplay,
                lang: s.lang
            })),
            skills: profileRes.skillStats
        };

        if (contestRes && contestRes.contestRating) {
            data.contestData = {
                rating: Math.round(contestRes.contestRating),
                globalRanking: contestRes.contestGlobalRanking || 0,
                totalParticipants: contestRes.totalParticipants || 0,
                topPercentage: contestRes.contestTopPercentage || 0,
                badge: contestRes.contestBadge?.name,
                contestsCount: contestRes.contestAttendCount || 0
            };
        }

        return data;
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        throw error;
    }
}
