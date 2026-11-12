[@zokugun/git-toolkit](https://github.com/zokugun/node-git-toolkit)
===================================================================

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@zokugun/git-toolkit?color=brightgreen)](https://www.npmjs.com/package/@zokugun/git-toolkit)
[![NodeJS Version](https://img.shields.io/badge/node.js-%3E%3D%2018.20-green)](#requirements)
[![Modules](https://img.shields.io/badge/modules-ESM%20%7C%20CJS-green)](#requirements)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-f87171?logo=kofi&logoColor=white)](https://ko-fi.com/daiyam)
[![Liberapay](https://img.shields.io/badge/Liberapay-facc15?logo=liberapay&logoColor=black)](https://liberapay.com/daiyam/donate)
[![PayPal](https://img.shields.io/badge/PayPal-5277C3?logo=paypal&logoColor=white)](https://paypal.me/daiyam99)

> Simplify repetitive Git tasks with a toolkit designed for reliability. Includes a transaction system that automatically restores state after operation failures.

Features
--------

- **Branch Management**: Checkout new branches with force option, fetch remote branches, verify local or remote branch existence via refs or ls-remote commands
- **Commit & Branch Info**: Get current head branch name, retrieve full commit hash for HEAD, determine default branch from remote symbolic ref
- **Repository Details**: Extract owner and repository names from GitHub remote URLs using regex pattern matching on git remote get-url output
- **Working Tree Status**: Check for staged, unstaged, or untracked changes by parsing porcelain status output into boolean flags indicating change types present
- **Stash Operations**: List all stashes with their selectors, hashes, and names; manage temporary stashes during transactions with automatic creation and cleanup
- **Tag Management**: Retrieve complete list of tags in repository using git tag --list command with blank line filtering for clean results
- **Transaction Safety**: Run Git operations within a transaction that automatically restores original branch, stash, and tag state on failure or success with optional cleanup of temporary changes

Installation
------------

```bash
npm add @zokugun/git-toolkit
```

Requirements
------------

- **Node.js**: `v18.20` or higher
- **Modules**: ECMAScript Modules (`ESM`) or CommonJS (`CJS`)

Quick Start
-----------

Use `withGitTransaction` to run git operations.<br />
It automatically saves your current working directory state and restores it after the operation finishes, regardless of whether the task succeeded or failed.

```typescript
import type { AsyncDResult } from '@zokugun/xtry';

import { checkoutNewBranch, withGitTransaction } from '@zokugun/git-toolkit';
import { err, OK, stringifyError } from '@zokugun/xtry';

async function runTask(cwd: string): AsyncDResult {
   const result = await checkoutNewBranch('temp-feature', false, cwd);

   if(result.fails) {
      return err('Failed to create branch');
   }

   return OK;
}

async function main(): Promise<void> {
   const result = await withGitTransaction(runTask, {
      cwd: '/path/to/repo',
      branchMode: 'any'
   });

   if(result.fails) {
      console.log(`Operation failed: ${stringifyError(result.error)}`);
   }
   else {
      console.log('Operation completed and state restored');
   }
}
```

API Reference
-------------

### Basic Operations

```typescript
type ChangeStatus = {
    staged: boolean;
    unstaged: boolean;
    untracked: boolean;
};
type GithubRepo = {
    owner: string;
    repo: string;
};
type Stash = {
    hash: string;
    name: string;
    selector: string;
};

function checkoutNewBranch(branch: string, force: boolean, cwd: string): Promise<Result<string, string>>;
function fetchBranch(branch: string, remote: string, cwd: string): Promise<Result<void, string>>;
function findDotGitDirectory(root: string): Promise<Result<string, string>>;
function getDefaultBranch(remote: string, cwd: string): Promise<Result<string, string>>;
function getGitHubRepository(remote: string, cwd: string): Promise<Result<GithubRepo | undefined, string>>;
function getHeadBranch(cwd: string): Promise<Result<string, string>>;
function getHeadCommitHash(cwd: string): Promise<Result<string, string>>;
function getWorkingTreeChangeStatus(cwd: string): Promise<Result<ChangeStatus, string>>;
function isLocalBranchBehindRemote(branch: string, remote: string, cwd: string): Promise<boolean>;
function isLocalBranchExists(branch: string, cwd: string): Promise<boolean>;
function isRemoteBranchExists(branch: string, remote: string, cwd: string): Promise<boolean>;
function isWorkingDirectoryClean(cwd: string): Promise<boolean>;
function listStashes(cwd: string): Promise<Result<Stash[], string>>;
function listTags(cwd: string): Promise<Result<string[], string>>;
```

### Transaction

```typescript
type TxAction = (cwd: string) => Promise<DResult<void, string>>;
type TxOptions = {
    branchMode?: 'any' | 'only-main' | 'switch-main';
    cwd: string;
    keepCopies?: boolean;
    remote?: string;
};

function withGitTransaction(run: TxAction, options: TxOptions): Promise<Result<void, string>>;
```

Contributions
-------------

Contributions are most welcome. Please:

- Open issues and feature requests under the repository discussions.
- Follow the [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Donations
---------

Support this project by becoming a financial contributor.

<table>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_kofi.png" alt="Ko-fi" width="80px" height="80px"></td>
      <td><a href="https://ko-fi.com/daiyam" target="_blank">ko-fi.com/daiyam</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_liberapay.png" alt="Liberapay" width="80px" height="80px"></td>
      <td><a href="https://liberapay.com/daiyam/donate" target="_blank">liberapay.com/daiyam/donate</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_paypal.png" alt="PayPal" width="80px" height="80px"></td>
      <td><a href="https://paypal.me/daiyam99" target="_blank">paypal.me/daiyam99</a></td>
   </tr>
</table>

License
-------

Copyright &copy; 2026-present Baptiste Augrain

Licensed under the [MIT license](https://opensource.org/licenses/MIT).
