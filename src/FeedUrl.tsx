import { useEffect, useRef, useState } from 'react';

export function FeedUrl({ url }: { url: string }) {
	const input = useRef<HTMLInputElement>(null);
	const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const mounted = useRef(false);
	const [copyLabel, setCopyLabel] = useState('Copy');

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			clearTimeout(resetTimeout.current);
		};
	}, []);

	async function copyFeedUrl() {
		input.current?.select();
		let result = 'Copy not supported';
		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(url);
				result = 'Copied!';
			} catch {
				result = 'Copy failed';
			}
		}
		if (!mounted.current) return;
		setCopyLabel(result);
		clearTimeout(resetTimeout.current);
		resetTimeout.current = setTimeout(() => setCopyLabel('Copy'), 2000);
	}

	return (
		<div className="mt-6 flex flex-col gap-2">
			<label htmlFor="feed-url" className="text-left text-base font-semibold text-slate-700">
				Calendar feed URL
			</label>
			<div className="flex items-center gap-2">
				<input
					id="feed-url"
					ref={input}
					className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
					type="text"
					value={url}
					readOnly
					onClick={(event) => event.currentTarget.select()}
					onFocus={(event) => event.currentTarget.select()}
				/>
				<button
					type="button"
					className="rounded-xl bg-blue-500 px-4 py-2 text-base font-semibold whitespace-nowrap text-white shadow transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
					onClick={copyFeedUrl}
					aria-live="polite"
				>
					{copyLabel}
				</button>
			</div>
		</div>
	);
}
