import { exec } from '@zokugun/exec-lite';

export async function isWorkingDirectoryClean(cwd: string): Promise<boolean> {
	const result = await exec('git', ['status', '--porcelain'], { cwd });

	if (result.fails) {
		return false;
	}

	return result.value.stdout === '';
}
