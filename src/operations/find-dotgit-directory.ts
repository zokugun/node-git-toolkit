import type { AsyncDResult } from '@zokugun/xtry';

import fse from '@zokugun/fs-extra-plus/async';
import { err, ok } from '@zokugun/xtry';

export async function findDotGitDirectory(root: string): AsyncDResult<string> {
	let parent = root;

	while(parent.length > 0) {
		const path = fse.join(parent, '.git');

		if(await fse.isDir(path)) {
			return ok(path);
		}

		parent = fse.parentPath(parent);
	}

	return err('`.git` not found');
}
