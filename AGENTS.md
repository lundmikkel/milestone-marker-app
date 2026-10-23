# Project guidance

## Project

Milestone Marker is a static React and TypeScript app built with Vite.
It generates calendar-feed links. Calendar generation lives in a
separate backend.

## Development

- Use npm and keep package-lock.json in sync with dependency changes.
- Follow existing TypeScript, React, and Tailwind conventions.
- Keep changes focused on the requested task.
- Preserve unrelated changes already in the working tree.

## Product behavior

- Gregorian dates only; presentation follows the browser locale.
- Time is optional and enabled with the Add time switch.
- Accept past dates, today, and future dates.
- Hide the feed link when visible input is incomplete or invalid.
- The time zone describes the reference event.
- Preserve entered clock time; let the backend handle DST.
- Do not persist form state or request the calendar feed.
- Preserve the existing feed URL contract.

## Verification

- Run npm run check and npm run lint.
- Run npm run test:unit -- --run for relevant logic changes.
- Run relevant Playwright tests for changes to browser interactions.
- Run npm run build when changing build or deployment configuration.
- Keep automated tests independent of the live backend.
- Report which checks passed and anything that could not be verified.

## Documentation

- Update README.md when setup or documented behavior changes.
