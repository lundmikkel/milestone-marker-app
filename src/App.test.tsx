import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import App from './App';

it('starts with a labeled, empty date field and no feed link', () => {
	render(<App />);
	expect(screen.getByRole('heading', { name: 'Milestone Marker', level: 1 })).toBeInTheDocument();
	expect(screen.getByRole('group', { name: 'Reference Date' })).toBeInTheDocument();
	expect(screen.getByLabelText('Time zone')).toHaveValue(
		Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	expect(screen.queryByLabelText('Calendar feed URL')).not.toBeInTheDocument();
});
