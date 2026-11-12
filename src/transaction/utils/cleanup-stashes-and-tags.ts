import type { AsyncDResult } from '@zokugun/xtry';
import type { Stash } from '#/types.js';

import { exec } from '@zokugun/exec-lite';
import { err, stringifyError, OK } from '@zokugun/xtry';

import { listStashes } from '#/operations/list-stashes.js';
import { listTags } from '#/operations/list-tags.js';

export async function cleanupStashesAndTags(cwd: string, oldStashes: Stash[], oldTags: string[]): AsyncDResult {
	const stashesResult = await listStashes(cwd);

	if (stashesResult.fails) {
		return stashesResult;
	}

	const hashes = oldStashes.map(({ hash }) => hash);

	for (const stash of stashesResult.value.reverse()) {
		if (!hashes.includes(stash.hash)) {
			const result = await exec('git', ['stash', 'drop', '--quiet', stash.selector], { cwd });

			if (result.fails) {
				return err(stringifyError(result.error));
			}
		}
	}

	const tagsResult = await listTags(cwd);

	if (tagsResult.fails) {
		return tagsResult;
	}

	for (const tag of tagsResult.value) {
		if (!oldTags.includes(tag)) {
			const result = await exec('git', ['tag', '--delete', tag], { cwd });

			if (result.fails) {
				return err(stringifyError(result.error));
			}
		}
	}

	return OK;
} // }}}

