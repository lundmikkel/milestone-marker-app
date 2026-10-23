import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedUrl } from './FeedUrl';

const url = 'https://ical.milestonemarker.app/feed/1990-06-15T14:30/Europe/Copenhagen';

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('feed link', () => {
	it('selects the read-only URL for manual copying', () => {
		render(<FeedUrl url={url} />);
		const input = screen.getByLabelText('Calendar feed URL') as HTMLInputElement;
		fireEvent.focus(input);
		expect(input).toHaveAttribute('readonly');
		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe(url.length);
	});

	it('copies the URL and resets its feedback after two seconds', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		render(<FeedUrl url={url} />);
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })));
		expect(writeText).toHaveBeenCalledWith(url);
		expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(2000));
		expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
	});

	it('reports a clipboard rejection', async () => {
		vi.stubGlobal('navigator', {
			clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }
		});
		render(<FeedUrl url={url} />);
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
	});

	it('supports manual copying when the clipboard API is absent', () => {
		vi.stubGlobal('navigator', {});
		render(<FeedUrl url={url} />);
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(screen.getByRole('button', { name: 'Copy not supported' })).toBeInTheDocument();
	});

	it('resets feedback when a changed URL creates a new feed field', async () => {
		vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
		const { rerender } = render(<FeedUrl key={url} url={url} />);
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		await screen.findByRole('button', { name: 'Copied!' });
		const nextUrl = url.replace('Europe/Copenhagen', 'Asia/Tokyo');
		rerender(<FeedUrl key={nextUrl} url={nextUrl} />);
		expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
		expect(screen.getByLabelText('Calendar feed URL')).toHaveValue(nextUrl);
	});
});

it('cleans up pending copy feedback when the field unmounts', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
	const timeout = vi.spyOn(globalThis, 'setTimeout');
	const clear = vi.spyOn(globalThis, 'clearTimeout');
	const { unmount } = render(<FeedUrl url={url} />);
	await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })));
	unmount();
	const copyTimerIndex = timeout.mock.calls.findIndex((call) => call[1] === 2000);
	expect(copyTimerIndex).toBeGreaterThanOrEqual(0);
	expect(clear).toHaveBeenCalledWith(timeout.mock.results[copyTimerIndex].value);
});

it('ignores clipboard completion after a URL field is removed', async () => {
	let resolve!: () => void;
	const completion = new Promise<void>((done) => {
		resolve = done;
	});
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => completion) } });
	const timeout = vi.spyOn(globalThis, 'setTimeout');
	const { unmount } = render(<FeedUrl url={url} />);
	fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
	unmount();
	await act(async () => resolve());
	expect(timeout.mock.calls.some((call) => call[1] === 2000)).toBe(false);
});
