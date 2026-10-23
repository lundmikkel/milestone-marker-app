import { useState, useContext, useEffect } from 'react';
import { getLocalTimeZone, today, toCalendarDateTime } from '@internationalized/date';
import type { DateValue, Time } from '@internationalized/date';
import {
	DateField,
	DateInput,
	DateSegment,
	Label,
	TimeField,
	I18nProvider,
	useLocale,
	DateFieldStateContext,
	TimeFieldStateContext
} from 'react-aria-components';
import logoUrl from './lib/assets/logo.svg';
import { buildFeedUrl, getTimeZoneOptions } from './lib/feed';
import { FeedUrl } from './FeedUrl';

export default function App() {
	const { locale } = useLocale();
	return (
		<I18nProvider locale={new Intl.Locale(locale, { calendar: 'gregory' }).toString()}>
			<ReferenceForm />
		</I18nProvider>
	);
}

// React Aria retains the last committed value during incomplete/invalid edits.
// Observe displayed segments as well so the URL always follows visible input.
function FieldValidity({
	time = false,
	onChange
}: {
	time?: boolean;
	onChange: (valid: boolean) => void;
}) {
	const dateState = useContext(DateFieldStateContext);
	const timeState = useContext(TimeFieldStateContext);
	const state = time ? timeState : dateState;
	const valid =
		!!state?.value &&
		!state.isInvalid &&
		state.segments.every((segment) => {
			if (segment.isEditable && segment.isPlaceholder) return false;
			const value = state.value;
			if (
				value &&
				(segment.type === 'year' || segment.type === 'month' || segment.type === 'day') &&
				segment.type in value
			) {
				return segment.value === value[segment.type];
			}
			return true;
		});
	useEffect(() => onChange(valid), [valid, onChange]);
	return null;
}

function ReferenceForm() {
	const [referenceDate, setReferenceDate] = useState<DateValue | null>(null);
	const [timeZone, setTimeZone] = useState(getLocalTimeZone);
	const [timeZoneOptions] = useState(() => getTimeZoneOptions(timeZone));
	const [placeholder] = useState(() => today(getLocalTimeZone()));
	const [dateValid, setDateValid] = useState(false);
	const [timeValid, setTimeValid] = useState(false);
	const [includeTime, setIncludeTime] = useState(false);
	const [time, setTime] = useState<Time | null>(null);
	const feedDate =
		referenceDate && dateValid && (!includeTime || (time && timeValid))
			? includeTime && time
				? toCalendarDateTime(referenceDate, time)
				: referenceDate
			: null;
	const feedUrl = buildFeedUrl(feedDate, timeZone);

	return (
		<main>
			<section className="flex flex-col items-center gap-8 px-6 py-16 text-center">
				<img src={logoUrl} alt="Milestone marker logo" width="200" className="mx-auto" />
				<div className="flex flex-col items-center gap-6">
					<h1 className="text-4xl font-bold sm:text-5xl">Milestone Marker</h1>
					<p className="max-w-2xl text-lg leading-relaxed sm:text-xl">
						<b>Never miss a milestone again.</b> Get memorable dates &ndash; like when you turn 1234
						weeks, 1 billion seconds, or 1/3 of 100 years &ndash; added directly to your calendar.
						Pick your birth date and time zone to get a custom link.
					</p>
				</div>
			</section>
			<section className="flex justify-center px-6 pb-24">
				<form
					className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-lg backdrop-blur"
					onSubmit={(event) => event.preventDefault()}
				>
					<DateField
						value={referenceDate}
						onChange={setReferenceDate}
						placeholderValue={placeholder}
						granularity="day"
						hideTimeZone
						className="flex w-full flex-col gap-3"
					>
						<FieldValidity onChange={setDateValid} />
						<Label className="text-left text-base font-semibold text-slate-700">
							Reference Date
						</Label>
						<DateInput className="flex w-full flex-wrap items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-base shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 hover:border-slate-400">
							{(segment) => (
								<DateSegment
									segment={segment}
									className={
										segment.type === 'literal'
											? 'px-0.5 text-slate-500 select-none'
											: 'rounded-md px-1 py-1 text-slate-700 outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400'
									}
								/>
							)}
						</DateInput>
					</DateField>
					<label className="relative mt-6 flex cursor-pointer items-center justify-between gap-3 text-left text-base font-semibold text-slate-700">
						<span>Add time</span>
						<input
							type="checkbox"
							role="switch"
							className="peer absolute top-1/2 right-0 h-6 w-11 -translate-y-1/2 cursor-pointer opacity-0"
							checked={includeTime}
							onChange={(event) => {
								setIncludeTime(event.target.checked);
								setTime(null);
								setTimeValid(false);
							}}
						/>
						<span
							aria-hidden="true"
							className="pointer-events-none flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-300 p-0.5 transition-colors peer-checked:bg-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2 peer-checked:[&>span]:translate-x-5"
						>
							<span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
						</span>
					</label>
					{includeTime && (
						<TimeField
							value={time}
							onChange={setTime}
							granularity="minute"
							className="mt-3 flex flex-col gap-3"
						>
							<FieldValidity time onChange={setTimeValid} />
							<Label className="font-semibold text-slate-700">Reference Time</Label>
							<DateInput className="flex flex-wrap rounded-xl border border-slate-300 bg-white px-3 py-2">
								{(segment) => (
									<DateSegment
										segment={segment}
										className="rounded-md px-1 py-1 text-slate-700 outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400"
									/>
								)}
							</DateInput>
						</TimeField>
					)}
					<div className="mt-6 flex flex-col gap-2">
						<label htmlFor="time-zone" className="text-left text-base font-semibold text-slate-700">
							Time zone
						</label>
						<select
							id="time-zone"
							className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
							value={timeZone}
							onChange={(event) => setTimeZone(event.target.value)}
						>
							{timeZoneOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
					{feedUrl && <FeedUrl key={feedUrl} url={feedUrl} />}
				</form>
			</section>
		</main>
	);
}
