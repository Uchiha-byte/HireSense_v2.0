function extractLeetCodeUsername(url) {
    if (!url) return '';

    // Try to match patterns like leetcode.com/u/username or leetcode.com/username
    const patterns = [
        /leetcode\.com\/u\/([^/?#]+)/i,
        /leetcode\.com\/(?!u\/)([^/?#]+)/i, // Negative lookahead to skip 'u/'
        /^([^/]+)$/
    ];

    for (const pattern of patterns) {
        const match = url.trim().match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return url.trim();
}

const testCases = [
    "https://leetcode.com/alfaarghya",
    "http://leetcode.com/alfaarghya",
    "leetcode.com/alfaarghya",
    "https://leetcode.com/u/alfaarghya",
    "leetcode.com/u/alfaarghya",
    "alfaarghya",
    "https://leetcode.com/u/alfaarghya?tab=profile",
    "https://leetcode.com/alfaarghya#submissions"
];

testCases.forEach(tc => {
    console.log(`URL: ${tc.padEnd(45)} => Username: ${extractLeetCodeUsername(tc)}`);
});
