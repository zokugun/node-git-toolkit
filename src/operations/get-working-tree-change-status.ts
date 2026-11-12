import type { AsyncDResult } from '@zokugun/xtry';
import type { ChangeStatus } from '#/types.js';

import { exec } from '@zokugun/exec-lite';
import { err, ok, stringifyError } from '@zokugun/xtry';

export async function getWorkingTreeChangeStatus(cwd: string): AsyncDResult<ChangeStatus> {
	const result = await exec('git', ['status', '--porcelain'], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	const stdout = result.value.stdout;
	const lines = stdout.length > 0 ? stdout.split('\n').filter((line) => line.trim().length > 0) : [];

	let staged = false;
	let unstaged = false;
	let untracked = false;

	for(const line of lines) {
		if(line.startsWith('??')) {
			untracked = true;
		}
		else {
			const x = line[0];
			const y = line[1];
			if(x !== ' ') {
				staged = true;
			}

			if(y !== ' ') {
				unstaged = true;
			}
		}
	}

	return ok({ staged, unstaged, untracked });
}
