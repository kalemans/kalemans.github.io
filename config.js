export const GITHUB_CONFIG = {
    owner: 'kalemans',
    repo: 'kalemans.github.io',
    dataPath: 'data/goals.json',
    clientId: 'YOUR_GITHUB_OAUTH_CLIENT_ID', // TODO: Set up GitHub OAuth App
};

export const PREDEFINED_TASKS = {
    personal: [
        // Original tasks
        { id: 'workout', name: 'Workout', category: 'Active Stuff', frequency: 'Daily' },
        { id: 'litter-box', name: 'Clean Litter Box', category: 'Chores', frequency: 'Daily' },
        { id: 'chainmail', name: 'Do Chainmail', category: 'Hobbies', frequency: 'Weekly' },
        { id: 'turkish', name: 'Study Turkish', category: 'Learning', frequency: 'Daily' },
        { id: 'read-book', name: 'Read Book', category: 'Hobbies', frequency: 'Daily' },
        { id: 'npr', name: 'Listen to NPR', category: 'Learning', frequency: 'Daily' },

        // New generic tasks
        { id: 'meditate', name: 'Meditate', category: 'Wellness', frequency: 'Daily' },
        { id: 'journal', name: 'Journal', category: 'Wellness', frequency: 'Daily' },
        { id: 'stretch', name: 'Stretch', category: 'Active Stuff', frequency: 'Daily' },
        { id: 'drink-water', name: 'Drink Water', category: 'Wellness', frequency: 'Daily' },
        { id: 'skincare', name: 'Skincare Routine', category: 'Self-Care', frequency: 'Daily' },
        { id: 'organize', name: 'Organize Space', category: 'Chores', frequency: 'Weekly' },
    ],
    couple: [
        // Original tasks
        { id: 'restaurant', name: 'Go to Restaurant', category: 'Dining', frequency: 'Weekly' },
        { id: 'cafe', name: 'Go to Cafe', category: 'Dining', frequency: 'Weekly' },
        { id: 'hike', name: 'Hike', category: 'Active', frequency: 'Weekly' },
        { id: 'cook', name: 'Cook Together', category: 'Creative', frequency: 'Weekly' },
        { id: 'walk', name: 'Take a Walk', category: 'Active', frequency: 'Daily' },
        { id: 'pingpong', name: 'Play Pingpong', category: 'Active', frequency: 'Weekly' },
        { id: 'billiards', name: 'Play Billiards', category: 'Active', frequency: 'Weekly' },
        { id: 'hottub', name: 'Hottub/Pool Time', category: 'Relaxation', frequency: 'Weekly' },
        { id: 'crafts', name: 'Do Arts/Crafts', category: 'Creative', frequency: 'Weekly' },

        // New generic tasks
        { id: 'movie', name: 'Watch Movie', category: 'Entertainment', frequency: 'Weekly' },
        { id: 'game-night', name: 'Game Night', category: 'Entertainment', frequency: 'Weekly' },
        { id: 'plan-trip', name: 'Plan Trip', category: 'Planning', frequency: 'Anytime' },
        { id: 'grocery-shop', name: 'Grocery Shop', category: 'Errands', frequency: 'Weekly' },
        { id: 'drive', name: 'Drive Around', category: 'Active', frequency: 'Weekly' },
        { id: 'new-recipe', name: 'Try New Recipe', category: 'Creative', frequency: 'Weekly' },
    ],
};
