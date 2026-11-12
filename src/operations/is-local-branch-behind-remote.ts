import { exec } from '@zokugun/exec-lite';

export async function isLocalBranchBehindRemote(branch: string, remote: string, cwd: string): Promise<boolean> {
	const result = await exec('git', ['rev-list', '--count', `${branch}..${remote}/${branch}`], { cwd });

	if(result.fails || result.value.exitCode !== 0) {
		return false;
	}

	return Number(result.value.stdout) > 0;
}
