import { CalendarDate, CalendarDateTime, parseZonedDateTime } from '@internationalized/date';
import { describe, expect, it, vi } from 'vitest';
import { buildFeedUrl, getTimeZoneOptions } from './feed';

describe('calendar feed URL', () => {
	it('stays empty until a reference date is available', () => {
		expect(buildFeedUrl(null, 'Europe/Copenhagen')).toBe('');
	});

	it('pads date and time fields and preserves the selected zone path', () => {
		expect(buildFeedUrl(new CalendarDateTime(2000, 2, 29, 4, 5), 'America/New_York')).toBe(
			'https://ical.milestonemarker.app/feed/2000-02-29T04:05/America/New_York'
		);
	});

	it.each([
		[new CalendarDate(1900, 1, 1), '1900-01-01'],
		[new CalendarDate(2000, 2, 29), '2000-02-29'],
		[new CalendarDate(2400, 12, 31), '2400-12-31'],
		[new CalendarDateTime(2000, 1, 1, 0, 0), '2000-01-01T00:00'],
		[new CalendarDateTime(2000, 1, 1, 23, 59, 59), '2000-01-01T23:59']
	])('formats ISO values without locale formatting or invented time: %s', (date, timestamp) => {
		expect(buildFeedUrl(date, 'UTC')).toBe(
			`https://ical.milestonemarker.app/feed/${timestamp}/UTC`
		);
	});

	it('preserves wall-clock time across zones rather than converting to UTC', () => {
		const date = parseZonedDateTime('2024-07-15T14:30[Europe/Copenhagen]');
		expect(buildFeedUrl(date, 'Asia/Tokyo')).toBe(
			'https://ical.milestonemarker.app/feed/2024-07-15T14:30/Asia/Tokyo'
		);
	});

	it('does not normalize a clock time in a daylight-saving gap', () => {
		expect(buildFeedUrl(new CalendarDateTime(2024, 3, 31, 2, 30), 'Europe/Copenhagen')).toBe(
			'https://ical.milestonemarker.app/feed/2024-03-31T02:30/Europe/Copenhagen'
		);
	});

	it('preserves date-only values without inventing a time', () => {
		expect(buildFeedUrl(new CalendarDate(9, 1, 2), 'UTC')).toBe(
			'https://ical.milestonemarker.app/feed/0009-01-02/UTC'
		);
	});
});

describe('time zones', () => {
	it('retains the local zone when the browser omits it', () => {
		vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['Europe/Copenhagen']);
		expect(getTimeZoneOptions('UTC')).toEqual(['UTC', 'Europe/Copenhagen']);
	});

	it.each(['missing', 'empty', 'throws'])('uses fallback zones when enumeration is %s', (mode) => {
		const supportedValuesOf = vi.spyOn(Intl, 'supportedValuesOf');
		if (mode === 'throws')
			supportedValuesOf.mockImplementation(() => {
				throw new Error('unsupported');
			});
		else if (mode === 'empty') supportedValuesOf.mockReturnValue([]);
		else Object.defineProperty(Intl, 'supportedValuesOf', { value: undefined, configurable: true });
		const options = getTimeZoneOptions('Europe/Copenhagen');
		expect(options).toContain('Europe/Copenhagen');
		expect(options).toContain('UTC');
		expect(options).toContain('Asia/Tokyo');
		expect(options.filter((zone) => zone === 'Europe/Copenhagen')).toHaveLength(1);
	});
});
