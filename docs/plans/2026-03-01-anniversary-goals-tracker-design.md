# Anniversary Goals Tracker - Design Document

**Date:** March 1, 2026
**Launch Target:** March 10, 2026 (Anniversary Gift)
**Project:** Mobile-first goal tracking website for personal and couple activities

## Project Context

This is an anniversary gift website for tracking and completing personal and couple goals. The user is motivated by checking off tasks and seeing statistics. The site must be mobile-friendly, easy to use, and launch by March 10, 2026.

**Key User Behaviors:**
- Loves checking boxes to complete tasks
- Motivated by seeing data and statistics
- Uses phone primarily
- Wants quick access without many clicks

## Requirements Summary

**Must Have (MVP by March 10):**
- Two goal sections: Personal Goals and Couple Goals
- Hybrid task system: predefined tasks + custom task creation
- Task frequencies: Daily, Weekly, Anytime
- Basic stats: streaks and completion counts
- Mobile-first tabbed interface
- GitHub backend for cross-device sync
- Playful, colorful design with celebration effects
- Gold star completion indicators

**Post-Launch Enhancements:**
- Detailed charts (pie, bar, line charts)
- Advanced statistics and trends
- Additional features as needed

## Technical Approach

**Stack:** Vanilla HTML/CSS/JavaScript (no framework)
- Fastest to develop for 9-day timeline
- Zero build configuration
- Perfect for GitHub Pages
- Lightweight and fast

**Architecture:** Single-page application with three main files
- `index.html` - Markup and structure
- `styles.css` - Playful mobile-first design
- `app.js` - Application logic using ES6 modules

**File Structure:**
```
/
├── index.html          # Main page
├── styles.css          # All styles
├── app.js             # Main application logic
├── data/
│   └── goals.json     # Task definitions and completion data
└── config.js          # GitHub repo configuration
```

## Design Details

### 1. Architecture Overview

**GitHub as Backend:**
- Data stored in `data/goals.json` in the repository
- GitHub REST API for read/write operations
- OAuth authentication with token stored in localStorage
- Token persists across sessions (no re-auth each time)

**Single-Page Application:**
- All interactions happen without page reloads
- Dynamic DOM updates with vanilla JavaScript
- CSS animations for smooth transitions
- Mobile-first responsive design

### 2. UI Components & Layout

**Three-Tab Navigation:**
1. **Personal Goals** - Individual tasks and activities
2. **Couple Goals** - Shared activities and experiences
3. **Stats** - Detailed statistics and trends

**Personal/Couple Goals Tab Structure:**
- Quick stats bar at top (streaks, daily progress)
- Category sections grouping related tasks
- Task cards with gold star toggles
- Floating action button (bottom-right) for adding tasks

**Task Card Design:**
- Large touch-friendly gold star (⭐ empty/filled)
- Task name prominently displayed
- Frequency badge (Daily/Weekly/Anytime)
- Streak indicator (e.g., "🔥 5")
- Three-dot menu for edit/delete (custom tasks only)

**Stats Tab Content:**
- Time period selector (Week/Month/Year)
- Category breakdown charts
- Completion trend over time
- Top streaks leaderboard
- Total achievements summary

**Add/Edit Task Modal:**
- Task name input field
- Category dropdown (predefined + add custom)
- Frequency selector buttons (Daily/Weekly/Anytime)
- Save/Cancel actions

**Celebration Effects:**
- Confetti animation on task completion
- Toast message with progress ("Great! 4/7 tasks today 🎉")
- Smooth star fill animation
- Haptic feedback (if supported on device)

### 3. Data Structure & Flow

**Data Schema (`data/goals.json`):**
```json
{
  "predefinedTasks": [
    {
      "id": "workout",
      "name": "Workout",
      "category": "Active Stuff",
      "frequency": "Daily",
      "type": "personal"
    }
  ],
  "customTasks": [],
  "customCategories": [],
  "completions": {
    "2026-03-01": {
      "workout": {
        "completed": true,
        "timestamp": "2026-03-01T08:30:00Z"
      }
    }
  },
  "streaks": {
    "workout": {
      "current": 5,
      "longest": 12
    }
  }
}
```

**Task Categories (Predefined):**

*Personal Goals:*
- Active Stuff: workout
- Chores: clean litter box
- Hobbies: do chainmail, read book
- Learning: study Turkish, listen to NPR

*Couple Goals:*
- Dining: go to restaurant, go to cafe
- Active: hike, take a walk, play pingpong, play billiards
- Relaxation: hottub/pool time
- Creative: cook, do arts/crafts

**Data Flow:**

1. **Page Load:**
   - Check for authentication token
   - Fetch `goals.json` from GitHub API
   - Cache in localStorage
   - Calculate current streaks from completions
   - Render UI

2. **Task Toggle:**
   - Update local state immediately (optimistic update)
   - Show celebration animation
   - Save to GitHub API in background
   - Update streaks if needed

3. **Add/Edit Task:**
   - Show modal form
   - Validate input
   - Update local state
   - Save to GitHub API
   - Refresh UI

4. **Stats Calculation:**
   - Filter completions by time period
   - Aggregate by category
   - Calculate trends
   - Render charts/visualizations

**GitHub API Operations:**
- Read: `GET /repos/{owner}/{repo}/contents/data/goals.json`
- Write: `PUT /repos/{owner}/{repo}/contents/data/goals.json` (with file SHA)
- Requires personal access token with `repo` scope

### 4. Error Handling & Offline Behavior

**Error Scenarios:**

*Authentication Errors:*
- Show friendly "Please log in with GitHub" message
- Display login button to initiate OAuth flow
- Clear invalid tokens from localStorage

*Network Errors:*
- Show toast: "Connection lost. Changes saved locally and will sync when online"
- Queue changes in localStorage
- Visual offline indicator (cloud icon with slash)
- Retry sync when connection returns

*Conflict Errors:*
- Fetch latest data from GitHub
- Show prompt: "Data was updated on another device. Refresh to see latest?"
- Reload button to fetch and merge

*Rate Limiting:*
- Cache data aggressively in localStorage
- Minimize API calls (batch updates if possible)
- Show message if rate limit hit: "Too many requests. Try again in a few minutes"

**Offline Support:**
- localStorage as primary cache
- Allow task toggling offline
- Queue changes for later sync
- Sync queue when connection returns
- Show sync status indicator

**Loading States:**
- Skeleton loading animation during initial fetch
- Disable task toggles during save operations
- Show spinner on stats calculations
- Progress indicators for long operations

### 5. Testing Strategy

**Manual Testing Checklist (Pre-Launch):**
- [ ] Test on actual mobile device (iOS/Android)
- [ ] GitHub authentication flow works
- [ ] Task creation, completion, editing, deletion
- [ ] Data persists across page refreshes
- [ ] Offline mode and sync queue
- [ ] All three tabs render correctly
- [ ] Celebration animations smooth on mobile
- [ ] Stats calculations accurate
- [ ] Touch targets are large enough
- [ ] No layout issues on small screens

**Browser Compatibility:**
- Primary: Mobile Safari, Mobile Chrome
- Secondary: Desktop Chrome, Firefox (ensure no breaking issues)

**Edge Cases:**
- First-time user (no data file)
- Multiple rapid toggles (no data loss)
- Task completion at midnight (date rollover)
- Long task/category names (text wrapping)
- Many tasks in category (scrolling performance)
- Switching devices mid-session

**Post-MVP Testing:**
- Automated tests for streak calculations
- Integration tests for GitHub API
- Performance testing with months of data
- Accessibility audit
- Cross-browser testing suite

## Visual Design Guidelines

**Color Palette (Playful & Fun):**
- Primary: Vibrant purple/pink for active elements
- Success: Gold/yellow for stars and achievements
- Background: Light gradient or soft pastel
- Text: Dark gray for readability
- Accents: Bright colors for categories

**Typography:**
- Sans-serif font (system font for performance)
- Large, readable sizes for mobile
- Bold weights for task names
- Lighter weights for metadata

**Animations:**
- Smooth tab transitions (200ms ease)
- Star fill animation (300ms with bounce)
- Confetti particles (1s duration)
- Toast slide-in/fade-out
- Micro-interactions on all taps

**Spacing:**
- Generous touch targets (min 44px)
- Comfortable padding between cards
- Clear visual hierarchy
- Breathing room around content

## Success Criteria

**MVP Launch (March 10):**
- ✅ Works flawlessly on mobile
- ✅ Authentication smooth and persistent
- ✅ Task completion feels rewarding
- ✅ Basic stats visible and accurate
- ✅ No data loss or sync issues
- ✅ Loads quickly on mobile networks

**User Experience Goals:**
- Quick access to check tasks (< 2 taps)
- Celebration effect feels motivating
- Stats provide meaningful insights
- Interface feels personal and special
- No friction in daily use

## Timeline & Phases

**Phase 1 (MVP - March 1-10):**
- Core task tracking functionality
- GitHub authentication and data storage
- Basic stats (streaks, counts)
- Mobile-optimized UI
- Celebration effects

**Phase 2 (Post-Launch - After March 10):**
- Detailed charts and visualizations
- Advanced statistics
- Performance optimizations
- Additional features based on usage

## Open Questions / Future Considerations

- Should stats show comparison to previous periods?
- Add reminders/notifications for daily tasks?
- Export data feature (CSV/PDF)?
- Dark mode toggle?
- Custom color themes?
- Share achievements feature?

---

**Design Approved:** March 1, 2026
**Ready for Implementation Planning**
