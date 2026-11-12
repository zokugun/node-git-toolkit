import type { AsyncDResult } from '@zokugun/xtry';

import { exec } from '@zokugun/exec-lite';
import { err, stringifyError, OK } from '@zokugun/xtry';

export async function restoreBranch(cwd: string, branch: string | null, head: string | null): AsyncDResult {
	if (branch !== null) {
		const checkoutResult = await exec('git', ['checkout', '--force', branch!], { cwd });

		if (checkoutResult.fails) {
			return err(stringifyError(checkoutResult.error));
		}
	}
	else if (head !== null) {
		const resetResult = await exec('git', ['reset', '--hard', head], { cwd });

		if (resetResult.fails) {
			return err(stringifyError(resetResult.error));
		}

		const cleanResult = await exec('git', ['clean', '-fd'], { cwd });

		if (resetResult.fails) {
			return err(stringifyError(cleanResult.error));
		}
	}

	return OK;
} // }}}

