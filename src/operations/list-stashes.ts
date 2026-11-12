import type { AsyncDResult } from '@zokugun/xtry';
import type { Stash } from '#/types.js';

import { exec } from '@zokugun/exec-lite';
import { err, ok, stringifyError } from '@zokugun/xtry';

const STASH_REGEX = /^\(([^\)]+)\)\(([^\)]+)\)[^:]+:\s*(.*)\s*$/

export async function listStashes(cwd: string): AsyncDResult<Stash[]> {
	const result = await exec('git', ['stash', 'list', '--format=(%gd)(%H)%s'], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	const stashes: Stash[] = [];

	for(const line of result.value.stdout.split('\n')) {
		const match = STASH_REGEX.exec(line);

		if(match) {
			const [, selector, hash, name] = match;

			stashes.push({ hash, name, selector });
		}
	}

	return ok(stashes);
}
