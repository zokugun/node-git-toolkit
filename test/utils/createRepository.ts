import fse from '@zokugun/fs-extra-plus/async';

import { git } from './git.js';

export async function createRepository(directory: string, options?: { pkg?: Record<string, unknown> }): Promise<{ remote: string; repository: string; }> {
	const repository = fse.join(directory, 'repository');
	const remote = fse.join(directory, 'remote.git');
	const pkg = { name: 'test', version: '1.0.0', ...options?.pkg };

	await fse.mkdir(repository, { recursive: true });
	await git(directory, 'init', '--bare', remote);
	await git(repository, 'init', '--initial-branch=main');
	await git(repository, 'config', 'user.name', 'Test User');
	await git(repository, 'config', 'user.email', 'test@example.com');
	await git(repository, 'remote', 'add', 'origin', remote);

	await fse.writeJSON(fse.join(repository, 'package.json'), pkg);
	await git(repository, 'add', '--all');
	await git(repository, 'commit', '--message', 'feat: initial commit');
	await git(repository, 'tag', '1.0.0');
	await git(repository, 'push', '--quiet', '--set-upstream', 'origin', 'main', '--tags');
	await git(repository, 'remote', 'set-head', 'origin', 'main');

	return { remote, repository };
}
