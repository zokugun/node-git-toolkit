import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, ok, stringifyError } from '@zokugun/xtry';

export async function checkoutNewBranch(branch: string, force: boolean, cwd: string): AsyncDResult<string> {
	const result = await exec('git', ['checkout', force ? '-B' : '-b', branch], { cwd });

	if (result.fails) {
		return err(stringifyError(result.error));
	}

	return ok(result.value.stdout.trim());
}
