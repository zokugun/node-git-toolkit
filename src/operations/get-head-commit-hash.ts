import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, ok, stringifyError } from '@zokugun/xtry';

export async function getHeadCommitHash(cwd: string): AsyncDResult<string> {
	const result = await exec('git', ['rev-parse', 'HEAD'], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	return ok(result.value.stdout.trim());
}
