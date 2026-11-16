import { createCommand } from '@zokugun/exec-lite';

export const git = createCommand(
	'git',
	null,
	{
		onSuccess: ({value}) => value.merged.trim(),
		onFailure: ({error}) => error.merged?.trim() ?? '',
	},
).toCwdFirst();
