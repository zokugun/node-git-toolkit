import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, ok, stringifyError } from '@zokugun/xtry';
import { isNonBlankString } from '@zokugun/is-it-type';

export async function listTags(cwd: string): AsyncDResult<string[]> {
	const result = await exec('git', ['tag', '--list'], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	const tags: string[] = [];

	for(const line of result.value.stdout.split('\n')) {
		if(isNonBlankString(line)) {
			tags.push(line.trim());
		}
	}

	return ok(tags);
}
