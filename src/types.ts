import type { DResult } from '@zokugun/xtry';

export type ChangeStatus = {
	staged: boolean;
	unstaged: boolean;
	untracked: boolean;
}

export type GithubRepo = {
  owner: string
  repo: string
}

export type Stash = {
	hash: string;
	name: string;
	selector: string;
}

export type TxAction = (cwd: string) => Promise<DResult<void, string>>;

export type TxOptions = {
	branchMode?: 'any' | 'only-main' | 'switch-main'
	cwd: string;
	keepCopies?: boolean;
	remote?: string;
};
