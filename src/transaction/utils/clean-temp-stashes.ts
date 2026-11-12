import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, stringifyError, OK } from '@zokugun/xtry';

import { listStashes } from '#/operations/list-stashes.js';

export async function cleanTempStashes(cwd: string, stagedStash: string | undefined, untrackedStash: string | undefined): AsyncDResult {
	const stashesResult = await listStashes(cwd);

	if (stashesResult.fails) {
		return stashesResult;
	}

	let staged: string | undefined;
	let untracked: string | undefined;

	for (const stash of stashesResult.value) {
		if (stash.name === stagedStash) {
			staged = stash.selector;
		}
		else if (stash.name === untrackedStash) {
			untracked = stash.selector;
		}
	}

	if (staged) {
		const stagedResult = await exec('git', ['stash', 'drop', staged], { cwd });

		if (stagedResult.fails) {
			return err(stringifyError(stagedResult.error));
		}
	}

	if (untracked) {
		const untrackedResult = await exec('git', ['stash', 'drop', untracked], { cwd });

		if (untrackedResult.fails) {
			return err(stringifyError(untrackedResult.error));
		}
	}

	return OK;
} // }}}

