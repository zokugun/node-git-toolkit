import type { AsyncDResult, DResult } from '@zokugun/xtry';
import type { TxAction, TxOptions } from '#/types.js';

import { exec } from '@zokugun/exec-lite';
import { err, OK, stringifyError } from '@zokugun/xtry';
import { namegen } from '@zokugun/namegen-lite';

import { getDefaultBranch } from '#/operations/get-default-branch.js';
import { getHeadBranch } from '#/operations/get-head-branch.js';
import { getHeadCommitHash } from '#/operations/get-head-commit-hash.js';
import { getWorkingTreeChangeStatus } from '#/operations/get-working-tree-change-status.js';
import { listStashes } from '#/operations/list-stashes.js';
import { listTags } from '#/operations/list-tags.js';
import { cleanTempStashes } from './utils/clean-temp-stashes.js';
import { restore } from './utils/restore.js';
import { restoreBranch } from './utils/restore-branch.js';
import { restoreStash } from './utils/restore-stash.js';

export async function withGitTransaction(run: TxAction, options: TxOptions): AsyncDResult {
	const { branchMode = 'any', cwd, keepCopies = false, remote = 'origin' } = options;

	let currentBranch: string | undefined;
	let mainBranch: string | undefined;

	if(branchMode !== 'any') {
		const currentResult = await getHeadBranch(cwd);

		if(currentResult.fails) {
			return currentResult;
		}

		const mainResult = await getDefaultBranch(remote, cwd);

		if(mainResult.fails) {
			return mainResult;
		}

		currentBranch = currentResult.value;
		mainBranch = mainResult.value;

		if(branchMode === 'only-main' && currentBranch !== mainBranch) {
			return err(`Only the "${mainBranch}" is supported`)
		}
	}

	const headResult = await getHeadCommitHash(cwd)

	if(headResult.fails) {
		return headResult;
	}

	const stashesResult = await listStashes(cwd);

	if(stashesResult.fails) {
		return stashesResult;
	}

	const tagsResult = await listTags(cwd);

	if(tagsResult.fails) {
		return tagsResult;
	}

	const existingChanges = await getWorkingTreeChangeStatus(cwd);

	if(existingChanges.fails) {
		return err(`'git status --porcelain' failed: ${existingChanges.error}`);
	}

	let stashCreated = false;
	let switchedToMain = false;
	let patchName: string | undefined;
	let stagedStash: string | undefined;
	let untrackedStash: string | undefined;

	const { staged, unstaged, untracked } = existingChanges.value;

	if(staged || unstaged || untracked) {
		const suffix = namegen();

		stagedStash = `STAGED_${suffix}`;
		untrackedStash = `UNTRACKED_${suffix}`;

		if(staged && !unstaged && !untracked) {
			const stashResult = await exec('git', ['stash', 'push', '--staged', '--quiet', '--message', stagedStash], { cwd });

			if(stashResult.fails) {
				return err(stringifyError(stashResult.error));
			}
		}
		else if(unstaged && !staged && !untracked) {
			const stashResult = await exec('git', ['stash', 'push', '--quiet', '--message', untrackedStash], { cwd });

			if(stashResult.fails) {
				return err(stringifyError(stashResult.error));
			}
		}
		else if(untracked && !staged && !unstaged) {
			const stashResult = await exec('git', ['stash', 'push', '--include-untracked', '--quiet', '--message', untrackedStash], { cwd });

			if(stashResult.fails) {
				return err(stringifyError(stashResult.error));
			}
		}
		else {
			patchName = `${namegen()}.patch`;

			const diffResult = await exec('git', ['diff', '>', patchName], { cwd });

			if(diffResult.fails) {
				return err(stringifyError(diffResult.error));
			}

			const stagedResult = await exec('git', ['stash', 'push', '--staged', '--quiet', '--message', stagedStash], { cwd });

			if(stagedResult.fails) {
				return err(stringifyError(stagedResult.error));
			}

			const restoreResult = await exec('git', ['restore', '.'], { cwd });

			if(restoreResult.fails) {
				return err(stringifyError(restoreResult.error));
			}

			const untrackedResult = await exec('git', ['stash', 'push', '--include-untracked', '--quiet', '--message', untrackedStash], { cwd });

			if(untrackedResult.fails) {
				return err(stringifyError(untrackedResult.error));
			}
		}

		stashCreated = true
	}

	if(branchMode !== 'any' && currentBranch !== mainBranch) {
		const checkoutResult = await exec('git', ['checkout', mainBranch!], { cwd });

		if(checkoutResult.fails) {
			await restore(cwd, null, headResult.value, stashesResult.value, tagsResult.value, stagedStash, untrackedStash, patchName);

			return err(`Failed to switch to ${mainBranch}: ${stringifyError(checkoutResult.error)}`);
		}

		switchedToMain = true;
	}
	else if(stashCreated && keepCopies) {
		const restoreResult = await restoreStash(cwd, stagedStash, untrackedStash, patchName, false);

		if(restoreResult.fails) {
			return restoreResult;
		}
	}

	let result: DResult;

	try {
		result = await run(cwd);
	}
	catch(error) {
		result = err(stringifyError(error));
	}

	if(result.fails) {
		await restore(cwd, switchedToMain ? mainBranch! : null, headResult.value, stashesResult.value, tagsResult.value, stagedStash, untrackedStash, patchName);

		return result;
	}

	if(branchMode !== 'any' && currentBranch !== mainBranch) {
		const branchResult = await restoreBranch(cwd, currentBranch!, null);

		if(branchResult.fails) {
			return branchResult;
		}

		if(stashCreated) {
			const stashResult = await restoreStash(cwd, stagedStash, untrackedStash, patchName, true);

			if(stashResult.fails) {
				return stashResult;
			}
		}
	}
	else if(stashCreated) {
		const stashResult = await cleanTempStashes(cwd, stagedStash, untrackedStash);

		if(stashResult.fails) {
			return stashResult;
		}
	}

	return OK;
}
