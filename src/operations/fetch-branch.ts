import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, OK, stringifyError } from '@zokugun/xtry';

export async function fetchBranch(branch: string, remote: string, cwd: string): AsyncDResult {
	const result = await exec('git', ['fetch', remote, branch], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	return OK;
}
