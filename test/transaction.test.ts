import fse from '@zokugun/fs-extra-plus/async';
import { err, OK } from '@zokugun/xtry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getHeadBranch, getHeadCommitHash, withGitTransaction } from '#/index.js';
import { createRepository } from './utils/createRepository.js';
import { git } from './utils/git.js';

describe('withGitTransaction', () => {
	let directory: string;
	let repository: string;

	beforeEach(async () => {
		const tempDirectory = await fse.makeTempDir({ prefix: 'git-toolkit-transaction-' });

		if(tempDirectory.fails) {
			throw tempDirectory.error;
		}

		directory = tempDirectory.value;
		({ repository } = await createRepository(directory));
	});

	afterEach(async () => {
		await fse.remove(directory);
	});

	it('runs the action and returns success', async () => {
		let called = false;

		const result = await withGitTransaction(async (cwd) => {
			called = true;

			expect(cwd).toBe(repository);

			return OK;
		}, { cwd: repository });

		expect(result.fails).toBe(false);
		expect(called).toBe(true);
	});

	it('rejects a non-main branch in only-main mode', async () => {
		await git(repository, 'checkout', '-b', 'feature/test');

		let called = false;

		const result = await withGitTransaction(async () => {
			called = true;

			return OK;
		}, { branchMode: 'only-main', cwd: repository });

		expect(result.fails).toBe(true);
		if(result.fails) {
			expect(result.error).toContain('Only the "main" is supported');
		}
		expect(called).toBe(false);
		expect(await getHeadBranch(repository)).toMatchObject({ fails: false, value: 'feature/test' });
	});

	it('runs on main and restores the original branch in switch-main mode', async () => {
		await git(repository, 'checkout', '-b', 'feature/test');

		let actionBranch = '';

		const result = await withGitTransaction(async (cwd) => {
			actionBranch = await git(cwd, 'branch', '--show-current');

			return OK;
		}, { branchMode: 'switch-main', cwd: repository });

		expect(result.fails).toBe(false);
		expect(actionBranch).toBe('main');
		expect(await getHeadBranch(repository)).toMatchObject({ fails: false, value: 'feature/test' });
	});

	it('restores the original commit when the action fails', async () => {
		const originalHead = await git(repository, 'rev-parse', 'HEAD');

		const result = await withGitTransaction(async (cwd) => {
			await fse.writeFile(fse.join(cwd, 'transaction.txt'), 'temporary change');
			await git(cwd, 'add', 'transaction.txt');
			await git(cwd, 'commit', '--message', 'feat: temporary transaction commit');

			return err('transaction failed');
		}, { cwd: repository });

		expect(result.fails).toBe(true);
		expect(await getHeadCommitHash(repository)).toMatchObject({ fails: false, value: originalHead });
		expect(await git(repository, 'status', '--porcelain')).toBe('');
	});

	it('preserves pre-existing untracked files when keepCopies is enabled', async () => {
		await fse.writeFile(fse.join(repository, 'preserved.txt'), 'existing work');

		const result = await withGitTransaction(async () => OK, { cwd: repository, keepCopies: true });

		expect(result.fails).toBe(false);
		expect(await git(repository, 'status', '--porcelain')).toBe('?? preserved.txt');
	});
});
