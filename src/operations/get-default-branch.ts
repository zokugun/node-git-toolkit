import type { AsyncDResult } from '@zokugun/xtry';

import { err, ok, stringifyError } from '@zokugun/xtry';
import { exec } from '@zokugun/exec-lite';

const SET_REGEX = /is now created and points to '([^']+)'/

export async function getDefaultBranch(remote: string, cwd: string): AsyncDResult<string> {
	const getResult = await exec('git', ['symbolic-ref', `refs/remotes/${remote}/HEAD`], { cwd });

	if(getResult.fails) {
		if(!getResult.error.stderr?.includes('is not a symbolic ref')) {
			return err(stringifyError(getResult.error));
		}

		const setResult = await exec('git', ['remote', 'set-head', remote, ' --auto'], { cwd });

		if(setResult.fails) {
			return err(stringifyError(setResult.error));
		}

		const match = SET_REGEX.exec(setResult.value.stdout);

		if(match) {
			return ok(match[1]);
		}
		else {
			return err('Cannot find the remote\'s default branch')
		}
	}

	const stdout = String(getResult.value.stdout).trim().split('/');

	return ok(stdout.at(-1)!);
}
