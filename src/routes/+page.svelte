<script lang="ts">
	import logoUrl from '$lib/assets/logo.svg?url';
	import { DateField } from 'bits-ui';
	import type { DateValue } from '@internationalized/date';
	import { getLocalTimeZone, now } from '@internationalized/date';
	import { onDestroy, onMount } from 'svelte';

	const feedBaseUrl = 'https://ical.milestonemarker.app/feed/';
	const placeholder = now(getLocalTimeZone());
	const pad = (value: number, length = 2) => value.toString().padStart(length, '0');

	let referenceDate: DateValue | undefined;
	let timeZone = getLocalTimeZone();
	let timeZoneOptions: string[] = [timeZone];
	const fallbackTimeZones = [
		'UTC',
		'Etc/UTC',
		'America/New_York',
		'Europe/London',
		'Europe/Copenhagen',
		'Asia/Tokyo',
		'Australia/Sydney'
	];
	const fallbackOptions = Array.from(new Set([timeZone, ...fallbackTimeZones]));

	let feedUrl = '';
	let feedUrlInput: HTMLInputElement | null = null;
	let copyButtonLabel = 'Copy';
	let copyResetTimeout: ReturnType<typeof setTimeout> | undefined;
	let previousFeedUrl = '';

	onMount(() => {
		if (typeof Intl === 'undefined') {
			timeZoneOptions = fallbackOptions;
			return;
		}

		try {
			if (typeof Intl.supportedValuesOf === 'function') {
				const supported = Intl.supportedValuesOf('timeZone');
				timeZoneOptions = supported.length ? supported : fallbackOptions;

				if (!timeZoneOptions.includes(timeZone)) {
					timeZone = timeZoneOptions[0] ?? timeZone;
				}
			} else {
				timeZoneOptions = fallbackOptions;
			}
		} catch {
			timeZoneOptions = fallbackOptions;
		}
	});

	const formatDateValueToIsoMinute = (date: DateValue) => {
		const hour = 'hour' in date ? date.hour : 0;
		const minute = 'minute' in date ? date.minute : 0;

		return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}T${pad(hour)}:${pad(minute)}`;
	};

	const selectFeedUrl = () => feedUrlInput?.select();

	const clearCopyResetTimeout = () => {
		if (copyResetTimeout) {
			clearTimeout(copyResetTimeout);
			copyResetTimeout = undefined;
		}
	};

	const scheduleCopyReset = () => {
		clearCopyResetTimeout();
		copyResetTimeout = setTimeout(() => {
			copyButtonLabel = 'Copy';
			copyResetTimeout = undefined;
		}, 2000);
	};

	const copyFeedUrl = async () => {
		if (!feedUrl) {
			return;
		}

		selectFeedUrl();

		if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(feedUrl);
				copyButtonLabel = 'Copied!';
			} catch {
				copyButtonLabel = 'Copy failed';
			}
		} else {
			copyButtonLabel = 'Copy not supported';
		}

		scheduleCopyReset();
	};

	$: feedUrl = referenceDate
		? `${feedBaseUrl}${formatDateValueToIsoMinute(referenceDate)}${timeZone ? `/${timeZone}` : ''}`
		: '';

	$: if (!feedUrl) {
		copyButtonLabel = 'Copy';
		clearCopyResetTimeout();
		previousFeedUrl = '';
	} else if (feedUrl !== previousFeedUrl) {
		copyButtonLabel = 'Copy';
		clearCopyResetTimeout();
		previousFeedUrl = feedUrl;
	}

	onDestroy(clearCopyResetTimeout);
</script>

<section class="flex flex-col items-center gap-8 px-6 py-16 text-center">
	<img src={logoUrl} alt="Milestone marker logo" width="200" class="mx-auto" />
	<div class="flex flex-col items-center gap-6">
		<h1 class="text-4xl font-bold sm:text-5xl">Milestone Marker</h1>
		<p class="max-w-2xl text-lg leading-relaxed sm:text-xl">
			<b>Never miss a milestone again.</b> Get memorable dates &dash; like when you turn 1234 weeks,
			1 billion seconds, or 1/3 of 100 years &dash; added directly to your calendar. Pick your birth
			date and time zone to get a custom link.
		</p>
	</div>
</section>

<section class="flex justify-center px-6 pb-24">
	<form
		class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-lg backdrop-blur"
	>
		<DateField.Root
			bind:value={referenceDate}
			{placeholder}
			granularity="minute"
			hideTimeZone={true}
		>
			<div class="flex w-full flex-col gap-3">
				<DateField.Label class="text-left text-base font-semibold text-slate-700">
					Reference Date
				</DateField.Label>
				<DateField.Input
					class="flex w-full items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-base shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 hover:border-slate-400"
				>
					{#snippet children({ segments })}
						<div class="flex flex-1 items-center">
							{#each segments as { part, value }, index (`${part}-${index}`)}
								{#if part === 'literal'}
									<DateField.Segment {part} class="px-0.5 text-slate-500 select-none">
										{value}
									</DateField.Segment>
								{:else}
									<DateField.Segment
										{part}
										class="rounded-md px-1 py-1 text-slate-700 outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
									>
										{value}
									</DateField.Segment>
								{/if}
							{/each}
						</div>
					{/snippet}
				</DateField.Input>
			</div>
		</DateField.Root>

		<div class="mt-6 flex flex-col gap-2">
			<label for="time-zone" class="text-left text-base font-semibold text-slate-700">
				Time zone
			</label>
			<select
				id="time-zone"
				class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
				bind:value={timeZone}
			>
				{#each timeZoneOptions as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>

		{#if feedUrl}
			<div class="mt-6 flex flex-col gap-2">
				<label for="feed-url" class="text-left text-base font-semibold text-slate-700">
					Calendar feed URL
				</label>
				<div class="flex items-center gap-2">
					<input
						id="feed-url"
						class="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						type="text"
						bind:this={feedUrlInput}
						value={feedUrl}
						readonly
						on:click={selectFeedUrl}
						on:focus={selectFeedUrl}
					/>
					<button
						type="button"
						class="rounded-xl bg-blue-500 px-4 py-2 text-base font-semibold text-white shadow transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
						on:click={copyFeedUrl}
					>
						{copyButtonLabel}
					</button>
				</div>
			</div>
		{/if}
	</form>
</section>
