import type { AsyncDResult } from '@zokugun/xtry';
import type { GitTokens } from '#/types.js';

import { exec } from '@zokugun/cli-utils/exec';
import { err, ok, stringifyError } from '@zokugun/xtry';

import { getHeadBranch } from '#/operations/get-head-branch.js';

export async function loadGitTokens(cwd: string): AsyncDResult<GitTokens> {
	const branch = await getHeadBranch(cwd);

	if(branch.fails) {
		return branch;
	}

	const result = await exec('git', ['describe', '--long', '--tags']);

	if(result.fails) {
		return err(stringifyError(result.error));
	}

	const data = result.value.all.split('-');
	const commitId = data.pop()!;
	const distance = data.pop()!;

	return ok({
		branch: branch.value,
		commitId,
		distance,
	});
}
