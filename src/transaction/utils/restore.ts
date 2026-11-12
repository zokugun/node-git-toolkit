import type { AsyncDResult } from '@zokugun/xtry';
import type { Stash } from '#/types.js';

import { cleanupStashesAndTags } from './cleanup-stashes-and-tags.js';
import { restoreBranch } from './restore-branch.js';
import { restoreStash } from './restore-stash.js';

export async function restore(cwd: string, branch: string | null, head: string, oldStashes: Stash[], oldTags: string[], stagedStash: string | undefined, untrackedStash: string | undefined, patchName: string | undefined): AsyncDResult {
	const branchResult = await restoreBranch(cwd, branch, head);

	if (branchResult.fails) {
		return branchResult;
	}

	if (stagedStash || untrackedStash || patchName) {
		const stashResult = await restoreStash(cwd, stagedStash, untrackedStash, patchName, false);

		if (stashResult.fails) {
			return stashResult;
		}
	}

	return await cleanupStashesAndTags(cwd, oldStashes, oldTags);
} // }}}

