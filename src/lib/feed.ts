import type { DateValue } from '@internationalized/date';

const feedBaseUrl = 'https://ical.milestonemarker.app/feed/';
const pad = (value: number, length = 2) => value.toString().padStart(length, '0');

export function buildFeedUrl(date: DateValue | null, timeZone: string): string {
	if (!date) return '';
	// The backend distinguishes dates without a time from explicit midnight.
	const day = `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
	const timestamp = 'hour' in date ? `${day}T${pad(date.hour)}:${pad(date.minute)}` : day;
	return `${feedBaseUrl}${timestamp}${timeZone ? `/${timeZone}` : ''}`;
}

export function getTimeZoneOptions(localTimeZone: string): string[] {
	try {
		const supported = Intl.supportedValuesOf?.('timeZone');
		if (supported?.length) return Array.from(new Set([localTimeZone, ...supported]));
	} catch {
		// Older browsers may not support enumerating time zones.
	}
	return Array.from(
		new Set([
			localTimeZone,
			'UTC',
			'Etc/UTC',
			'America/New_York',
			'Europe/London',
			'Europe/Copenhagen',
			'Asia/Tokyo',
			'Australia/Sydney'
		])
	);
}
