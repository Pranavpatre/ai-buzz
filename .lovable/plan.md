

## Problem

1. **Digests are hardcoded** -- the `SAMPLE_DIGESTS` array is static. Adding a new feed and clicking refresh does nothing because the digest list never changes.
2. **Only 3 articles** -- there are exactly 3 items in `SAMPLE_DIGESTS`, and all are rendered. There's no scrollable/feed-style layout.

## Plan

### 1. Make digests reactive to feeds

- Move `SAMPLE_DIGESTS` into state (e.g., `useState`) so it can be updated.
- Create a mapping of feed names to sample digest data, so when a new feed is added, a placeholder/sample digest can be generated for it.
- When the user clicks **Refresh**, generate digest entries for any feeds that don't yet have a corresponding digest. This simulates what the backend will eventually do.
- After Cloud is enabled, this will be replaced with real RSS fetching, but for now the refresh button will at least produce visible results.

### 2. Add more sample digests and remove the 3-item cap

- Add more sample digest entries (7-10 total) covering all the default feeds so the UI feels fuller.
- Remove the implicit limit -- all digests render in a vertical scroll.

### 3. Scrollable Instagram-style feed layout

- Restyle the digest tab to be a single-column, full-width scrollable feed.
- Each `DigestCard` takes the full content width, stacked vertically with clear spacing -- like scrolling through Instagram posts.
- Add a subtle separator or extra padding between cards.
- The summary footer ("That's N podcasts and M newsletters") sticks at the bottom after the last card.

### Technical Details

**Files to modify:**

- **`src/pages/Index.tsx`**
  - Convert `SAMPLE_DIGESTS` from a const to `useState` with a richer initial set (7-10 items).
  - In `handleRefresh`, check feeds that have no matching digest entry and add placeholder digests for them.
  - Update `handleAddFeed` to optionally auto-switch to the digest tab after refresh.
  - Update the digest `TabsContent` to use a max-width single-column layout with larger vertical gaps.

- **`src/components/DigestCard.tsx`**
  - No major changes needed; the card is already well-structured for a vertical feed.
  - Minor tweak: slightly increase vertical padding for a more spacious "card-per-screen" feel.

