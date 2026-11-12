import fse from '@zokugun/fs-extra-plus/async';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { checkoutNewBranch, fetchBranch, findDotGitDirectory, getDefaultBranch, getGitHubRepository, getHeadBranch, getHeadCommitHash, getWorkingTreeChangeStatus, isLocalBranchBehindRemote, isLocalBranchExists, isRemoteBranchExists, isWorkingDirectoryClean, listStashes, listTags } from '#/index.js';
import { createRepository } from './utils/createRepository.js';
import { git } from './utils/git.js';

let directory: string;
let remote: string;
let repository: string;

beforeEach(async () => {
	const tempDirectory = await fse.makeTempDir({ prefix: 'git-toolkit-' });

	if(tempDirectory.fails) {
		throw tempDirectory.error;
	}

	directory = tempDirectory.value;

	({ remote, repository } = await createRepository(directory));
});

afterEach(async () => {
	await fse.remove(directory);
});

it('checks out a new branch', async () => {
	const result = await checkoutNewBranch('feature/test', false, repository);

	expect(result.fails).toBe(false);
	expect(await getHeadBranch(repository)).toMatchObject({ fails: false, value: 'feature/test' });
});

it('fetches a remote branch', async () => {
	await git(repository, 'checkout', '-b', 'feature/fetch');
	await fse.writeFile(fse.join(repository, 'feature.txt'), 'feature');
	await git(repository, 'add', '--all');
	await git(repository, 'commit', '--message', 'feat: add feature');
	await git(repository, 'push', '--quiet', 'origin', 'feature/fetch');
	await git(repository, 'checkout', 'main');

	const result = await fetchBranch('feature/fetch', 'origin', repository);

	expect(result.fails).toBe(false);
	expect(await git(repository, 'rev-parse', 'refs/remotes/origin/feature/fetch')).not.toBe('');
});

it('finds the repository Git directory from a nested path', async () => {
	const nested = fse.join(repository, 'nested', 'directory');
	await fse.mkdir(nested, { recursive: true });

	expect(await findDotGitDirectory(nested)).toMatchObject({ fails: false, value: fse.join(repository, '.git') });
});

it('gets the remote default branch', async () => {
	expect(await getDefaultBranch('origin', repository)).toMatchObject({ fails: false, value: 'main' });
});

it('parses a GitHub repository remote', async () => {
	await git(repository, 'remote', 'set-url', 'origin', 'https://github.com/octocat/hello-world.git');
	expect(await git(repository, 'remote', 'get-url', 'origin')).toBe('https://github.com/octocat/hello-world.git');

	expect(await getGitHubRepository('origin', repository)).toMatchObject({
		fails: false,
		value: { owner: 'octocat', repo: 'hello-world' },
	});
});

it('gets the current branch', async () => {
	expect(await getHeadBranch(repository)).toMatchObject({ fails: false, value: 'main' });
});

it('gets the current commit hash', async () => {
	const expectedHash = await git(repository, 'rev-parse', 'HEAD');

	expect(await getHeadCommitHash(repository)).toMatchObject({ fails: false, value: expectedHash });
});

it('reports staged, unstaged, and untracked changes', async () => {
	const packagePath = fse.join(repository, 'package.json');
	const packageContents = await fse.readFile(packagePath, 'utf8');

	expect(packageContents.fails).toBe(false);

	if(packageContents.fails) {
		throw packageContents.error;
	}

	await fse.writeFile(packagePath, `${packageContents.value}\n`);

	expect(await getWorkingTreeChangeStatus(repository)).toMatchObject({
		fails: false,
		value: { staged: false, unstaged: true, untracked: false },
	});

	await git(repository, 'add', 'package.json');
	await fse.writeFile(fse.join(repository, 'untracked.txt'), 'new file');

	expect(await getWorkingTreeChangeStatus(repository)).toMatchObject({
		fails: false,
		value: { staged: true, unstaged: false, untracked: true },
	});
});

it('detects when a local branch is behind its remote', async () => {
	const clone = fse.join(directory, 'clone');
	await git(directory, 'clone', remote, clone);
	await git(clone, 'config', 'user.name', 'Test User');
	await git(clone, 'config', 'user.email', 'test@example.com');
	await fse.writeFile(fse.join(clone, 'remote.txt'), 'remote change');
	await git(clone, 'add', '--all');
	await git(clone, 'commit', '--message', 'feat: remote change');
	await git(clone, 'push', '--quiet', 'origin', 'main');
	await fetchBranch('main', 'origin', repository);

	expect(await isLocalBranchBehindRemote('main', 'origin', repository)).toBe(true);
});

it('checks whether a local branch exists', async () => {
	expect(await isLocalBranchExists('main', repository)).toBe(true);
	expect(await isLocalBranchExists('missing', repository)).toBe(false);
});

it('checks whether a remote branch exists', async () => {
	expect(await isRemoteBranchExists('main', 'origin', repository)).toBe(true);
	expect(await isRemoteBranchExists('missing', 'origin', repository)).toBe(false);
});

it('checks whether the working directory is clean', async () => {
	expect(await isWorkingDirectoryClean(repository)).toBe(true);

	await fse.writeFile(fse.join(repository, 'untracked.txt'), 'new file');
	expect(await isWorkingDirectoryClean(repository)).toBe(false);
});

it('lists stashes', async () => {
	const packagePath = fse.join(repository, 'package.json');
	const packageContents = await fse.readFile(packagePath, 'utf8');

	expect(packageContents.fails).toBe(false);

	if(packageContents.fails) {
		throw packageContents.error;
	}

	await fse.writeFile(packagePath, `${packageContents.value}\n`);
	await git(repository, 'stash', 'push', '--message', 'saved work');

	const result = await listStashes(repository);

	expect(result.fails).toBe(false);

	if(result.fails) {
		return;
	}

	expect(result.value).toHaveLength(1);
	expect(result.value[0]).toMatchObject({ name: 'saved work', selector: 'stash@{0}' });
	expect(result.value[0].hash).toMatch(/^[a-f0-9]{40}$/);
});

it('lists tags', async () => {
	expect(await listTags(repository)).toMatchObject({ fails: false, value: ['1.0.0'] });
});
