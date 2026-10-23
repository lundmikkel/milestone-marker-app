import { expect, test, type Page } from '@playwright/test';

const base = 'https://ical.milestonemarker.app/feed/';
async function date(page: Page, year = '1990', month = '6', day = '15') {
	const field = page.getByRole('group').filter({ has: page.locator('[data-type="year"]') });
	for (const [part, value] of [
		['year', year],
		['month', month],
		['day', day]
	]) {
		await field.locator(`[data-type="${part}"]`).fill(value);
	}
}
async function time(page: Page) {
	await page.getByLabel('Add time').check();
	const field = page.getByRole('group', { name: 'Reference Time' });
	await field.locator('[data-type="hour"]').fill('2');
	await field.locator('[data-type="minute"]').fill('30');
	await field.locator('[data-type="dayPeriod"]').fill('PM');
}

test('date-only generation, reference zone changes, copying, and responsive layout', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/');
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
	await expect(page.getByLabel('Time zone')).toHaveValue('Europe/Copenhagen');
	await expect(page.getByLabel('Add time')).not.toBeChecked();
	await expect(page.locator('[data-type="hour"]')).toHaveCount(0);
	await date(page);
	const url = page.getByLabel('Calendar feed URL');
	await expect(url).toHaveValue(`${base}1990-06-15/Europe/Copenhagen`);
	await page.getByLabel('Time zone').selectOption('Asia/Tokyo');
	await expect(url).toHaveValue(`${base}1990-06-15/Asia/Tokyo`);
	await page.getByRole('button', { name: 'Copy', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
	await expect
		.poll(() => page.evaluate(() => navigator.clipboard.readText()))
		.toBe(`${base}1990-06-15/Asia/Tokyo`);
	await page.getByLabel('Time zone').selectOption('Europe/Copenhagen');
	await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		.toBe(true);
});

test('optional time must be complete and can be removed without changing the date', async ({
	page
}) => {
	await page.goto('/');
	await date(page);
	await page.getByLabel('Add time').check();
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
	await page.getByLabel('Add time').uncheck();
	await time(page);
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}1990-06-15T14:30/Europe/Copenhagen`
	);
	await page.getByLabel('Time zone').selectOption('America/New_York');
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}1990-06-15T14:30/America/New_York`
	);
	await page.getByLabel('Add time').uncheck();
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}1990-06-15/America/New_York`
	);
});

test('clearing a date or time segment immediately removes a stale link', async ({ page }) => {
	await page.goto('/');
	await date(page);
	await page.locator('[data-type="day"]').press('Backspace');
	await page.locator('[data-type="day"]').press('Backspace');
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
	await page.locator('[data-type="day"]').fill('16');
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}1990-06-16/Europe/Copenhagen`
	);
	await time(page);
	await page.locator('[data-type="minute"]').press('Backspace');
	await page.locator('[data-type="minute"]').press('Backspace');
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
});

test('future dates and leap days are accepted', async ({ page }) => {
	await page.goto('/');
	await date(page, '2400', '2', '29');
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}2400-02-29/Europe/Copenhagen`
	);
});

test('reload clears the form and generation neither stores state nor contacts the feed service', async ({
	page
}) => {
	const requests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('ical.milestonemarker.app')) requests.push(request.url());
	});
	await page.goto('/');
	await date(page);
	await time(page);
	await expect(page.getByLabel('Calendar feed URL')).toBeVisible();
	expect(
		await page.evaluate(() => ({
			local: localStorage.length,
			session: sessionStorage.length,
			cookies: document.cookie
		}))
	).toEqual({ local: 0, session: 0, cookies: '' });
	await page.reload();
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
	await expect(page.getByLabel('Add time')).not.toBeChecked();
	expect(requests).toEqual([]);
});

for (const locale of ['en-GB', 'de-DE', 'en-US-u-ca-islamic']) {
	test.describe(locale, () => {
		test.use({ locale });
		test('uses locale date order with Gregorian values and an invariant ISO link', async ({
			page
		}) => {
			await page.goto('/');
			await date(page, '2000', '2', '29');
			await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
				`${base}2000-02-29/Europe/Copenhagen`
			);
			const parts = await page
				.getByRole('spinbutton')
				.evaluateAll((elements) => elements.map((el) => el.getAttribute('data-type')));
			expect(parts).toEqual(
				locale.startsWith('en-US') ? ['month', 'day', 'year'] : ['day', 'month', 'year']
			);
		});
	});
}

test('an impossible date hides the link while editing and a valid correction restores it', async ({
	page
}) => {
	await page.goto('/');
	await date(page, '2000', '2', '29');
	await expect(page.getByLabel('Calendar feed URL')).toBeVisible();
	await page.locator('[data-type="day"]').fill('31');
	await expect(page.getByLabel('Calendar feed URL')).toHaveCount(0);
	await page.locator('[data-type="day"]').fill('28');
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}2000-02-28/Europe/Copenhagen`
	);
});

test('today is accepted without a time', async ({ page }) => {
	await page.goto('/');
	const parts = await page.evaluate(() => {
		const values = new Intl.DateTimeFormat('en-US', {
			timeZone: 'Europe/Copenhagen',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(new Date());
		return Object.fromEntries(values.map((part) => [part.type, part.value]));
	});
	await date(page, parts.year, parts.month, parts.day);
	await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
		`${base}${parts.year}-${parts.month}-${parts.day}/Europe/Copenhagen`
	);
});

test.describe('24-hour time', () => {
	test.use({ locale: 'en-GB' });
	test('follows locale time formatting while preserving ISO time', async ({ page }) => {
		await page.goto('/');
		await date(page);
		await page.getByLabel('Add time').check();
		await expect(page.locator('[data-type="dayPeriod"]')).toHaveCount(0);
		await page.locator('[data-type="hour"]').fill('23');
		await page.locator('[data-type="minute"]').fill('59');
		await expect(page.getByLabel('Calendar feed URL')).toHaveValue(
			`${base}1990-06-15T23:59/Europe/Copenhagen`
		);
	});
});
