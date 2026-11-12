import { exec } from '@zokugun/exec-lite';

export async function isRemoteBranchExists(branch: string, remote: string, cwd: string): Promise<boolean> {
	const result = await exec('git', ['ls-remote', '--heads', remote, branch], { cwd });

	if(result.fails) {
		return false;
	}

	return result.value.stdout.length !== 0;
}
