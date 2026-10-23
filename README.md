# Milestone Marker

A static React app that builds a personalized calendar-feed URL from a reference date, time, and time zone. The feed service at `https://ical.milestonemarker.app` generates milestone events; its implementation is outside this repository.

## Development

Use Node.js 22.12+ (or 20.19+) and npm.

```sh
npm ci
npm run dev
```

The app uses React, TypeScript, Vite, Tailwind CSS, React Aria Components, and `@internationalized/date`. It has one page and needs no application server, database, or environment secrets.

## Behavior

Enter a reference date in the segmented date field, optionally enable **Add time**, select the reference event’s time zone, then copy the generated URL into a calendar application's subscription settings:

```text
https://ical.milestonemarker.app/feed/1990-06-15T14:30/Europe/Copenhagen
```

Date-only links use `YYYY-MM-DD` without an invented midnight time. When enabled, time must be complete and is preserved to minute precision. Today and future dates are accepted. Clearing a required segment removes the link immediately. The URL appends the selected IANA time zone. It does not convert the time to UTC. The local time zone is selected initially, with fallback options for browsers that cannot enumerate supported zones.

Dates are not saved by the frontend. The reference date and time zone are visible in the copied URL. The app builds the URL locally and does not fetch or validate the external feed.

## Code

- `src/App.tsx`: page layout, Gregorian date field, optional time toggle, time-zone selection, and derived feed URL. Input presentation follows the browser locale.
- `src/FeedUrl.tsx`: read-only link field and clipboard feedback. Keyed by URL to reset feedback and clean up timers when the inputs change.
- `src/lib/feed.ts`: feed URL formatting and supported/fallback time zones.
- `src/app.css`: Tailwind entry point and brand color.
- `public/`: files copied unchanged to production, including the custom-domain `CNAME`.

## Checks

```sh
npm run check
npm run lint
npm run test:unit -- --run
npx playwright install chromium
npm run test:e2e
```

`npm test` runs both unit/component tests and browser tests. Component tests use React Testing Library with jsdom; Playwright exercises the real date field, time-zone changes, and clipboard on desktop and mobile viewports. Browser tests launch a production build locally.

## Build and deployment

```sh
npm run build
npm run preview
```

Vite writes the static site to `build/`. GitHub Actions checks and builds pushes and pull requests to `main`; only pushes to `main` deploy to GitHub Pages.

The production custom domain is `milestonemarker.app`, configured through `public/CNAME`. The workflow builds for the domain root. For hosting under a subdirectory, set the base path when building and configure the hosting domain separately:

```sh
BASE_PATH=/milestone-marker-app/ npm run build
```

Development always uses `/`. No routing library or SPA fallback is required for the single-page app.

## Test coverage

Tests cover date-only and timed ISO links, leap days, future dates, reference-zone changes without clock conversion, DST pass-through, missing time-zone enumeration, optional time toggling, incomplete-field clearing, clipboard feedback and timer cleanup, browser-default zones, responsive layout, locale date ordering, Gregorian-only entry, reload resets, and absence of persistence or feed requests. Tests never call the calendar backend. CI runs unit and browser tests on pull requests.
