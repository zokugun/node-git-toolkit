import type { AsyncDResult } from '@zokugun/xtry';
import type { GithubRepo } from '#/types.js';

import { exec } from '@zokugun/exec-lite';
import { err, ok, OK_UNDEFINED, stringifyError } from '@zokugun/xtry';

export async function getGitHubRepository(remote: string, cwd: string): AsyncDResult<GithubRepo | undefined> {
	const result = await exec('git', ['remote', 'get-url', remote], { cwd });

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	const match = result.value.stdout.trim().match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/)

  	if(!match) {
    	return OK_UNDEFINED;
	}

  return ok({ owner: match[1], repo: match[2] });
}
