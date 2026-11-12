import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import fse from '@zokugun/fs-extra-plus/async';
import { err, stringifyError, OK } from '@zokugun/xtry';

import { listStashes } from '#/operations/list-stashes.js';

export async function restoreStash(cwd: string, stagedStash: string | undefined, untrackedStash: string | undefined, patchName: string | undefined, drop: boolean): AsyncDResult { // {{{
	const stashesResult = await listStashes(cwd);

	if(stashesResult.fails) {
		return stashesResult;
	}

	let staged: string | undefined;
	let untracked: string | undefined;

	for(const stash of stashesResult.value) {
		if(stash.name == stagedStash) {
			staged = stash.selector;
		}
		else if(stash.name === untrackedStash) {
			untracked = stash.selector;
		}
	}

	if(!staged && !untracked) {
		return err('Cannot find the temporary stashes')
	}

	const action = drop ? 'pop' : 'apply';

	if(staged) {
		const stagedResult = await exec('git', ['stash', action, '--index', staged], { cwd });

		if(stagedResult.fails) {
			return err(stringifyError(stagedResult.error));
		}
	}

	if(untracked) {
		const untrackedResult = await exec('git', ['stash', action, '--index', untracked], { cwd });

		if(untrackedResult.fails) {
			return err(stringifyError(untrackedResult.error));
		}
	}

	if(patchName) {
		const patchResult = await exec('git', ['apply', '--ignore-space-change', '--ignore-whitespace', '-v', '<', patchName], { cwd });

		if(patchResult.fails) {
			return err(stringifyError(patchResult.error));
		}

		const removeResult = await fse.remove(fse.join(cwd, patchName));

		if(removeResult.fails) {
			return err(stringifyError(removeResult.error));
		}
	}

	return OK;
} // }}}
