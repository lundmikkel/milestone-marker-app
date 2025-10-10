<script lang="ts">
	import logoUrl from '$lib/assets/logo.svg?url';
	import { DateField } from 'bits-ui';
	import type { DateValue } from '@internationalized/date';
	import { getLocalTimeZone, now } from '@internationalized/date';
	import { onDestroy } from 'svelte';

	const feedBaseUrl = 'https://ical.milestonemarker.app/feed/';
	const placeholder = now(getLocalTimeZone());
	const pad = (value: number) => value.toString().padStart(2, '0');

	let referenceDate: DateValue | undefined;
	let feedUrl = '';
	let feedUrlInput: HTMLInputElement | null = null;
	let copyButtonLabel = 'Copy';
	let copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

	const formatDateValueToIsoMinute = (date: DateValue) => {
		const hour = 'hour' in date ? date.hour : 0;
		const minute = 'minute' in date ? date.minute : 0;

		return `${date.year}-${pad(date.month)}-${pad(date.day)}T${pad(hour)}:${pad(minute)}`;
	};

	const selectFeedUrl = () => {
		feedUrlInput?.select();
	};

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
		? `${feedBaseUrl}${formatDateValueToIsoMinute(referenceDate)}`
		: '';

	$: if (!feedUrl) {
		copyButtonLabel = 'Copy';
		clearCopyResetTimeout();
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
			hideTimeZone={false}
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

		{#if feedUrl}
			<div class="mt-6 flex flex-col gap-2">
				<label for="feed-url" class="text-left text-base font-semibold text-slate-700">
					Calendar feed URL
				</label>
				<div class="flex items-center gap-2">
					<input
						id="feed-url"
						class="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-slate-400"
						type="text"
						bind:this={feedUrlInput}
						value={feedUrl}
						readonly
						on:click={selectFeedUrl}
						on:focus={selectFeedUrl}
					/>
					<button
						type="button"
						class="rounded-xl bg-blue-500 px-4 py-2 text-base font-semibold text-white shadow transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
						on:click={copyFeedUrl}
					>
						{copyButtonLabel}
					</button>
				</div>
			</div>
		{/if}
	</form>
</section>
