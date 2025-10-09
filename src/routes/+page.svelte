<script lang="ts">
	import logoUrl from '$lib/assets/logo.svg?url';
	import { DateField } from 'bits-ui';
	import type { DateValue } from '@internationalized/date';
	import { getLocalTimeZone, today } from '@internationalized/date';

	let referenceDate: DateValue | undefined;
	const placeholder = today(getLocalTimeZone());
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
	</form>
</section>
