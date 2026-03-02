export interface LeetCodeData {
    username: string;
    name?: string;
    avatar?: string;
    ranking: number;
    reputation: number;
    totalSolved: number;
    totalQuestions: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
    contributionPoints: number;
    badges: LeetCodeBadge[];
    contestData?: LeetCodeContestData;
    submissionCalendar: Record<string, number>; // timestamp -> count
    recentSubmissions: LeetCodeSubmission[];
    skills?: {
        advanced: Array<{ name: string; count: number }>;
        intermediate: Array<{ name: string; count: number }>;
        fundamental: Array<{ name: string; count: number }>;
    };
}

export interface LeetCodeBadge {
    name: string;
    icon: string;
    creationDate?: string;
}

export interface LeetCodeContestData {
    rating: number;
    globalRanking: number;
    totalParticipants: number;
    topPercentage: number;
    badge?: string;
    contestsCount: number;
}

export interface LeetCodeSubmission {
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
}
