import { exec } from '@zokugun/exec-lite';

export async function isLocalBranchExists(branch: string, cwd: string): Promise<boolean> {
	const result = await exec('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd });

	if(result.fails) {
		return false;
	}

	return result.value.exitCode === 0;
}
