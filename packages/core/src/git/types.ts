export type GitInfo = {
  /** HEAD sha. */
  commit: string;
  /** Absent on a detached HEAD. */
  branch?: string;
  /** Uncommitted changes under the config root. */
  dirty: boolean;
  /** History-based dates may be wrong. */
  shallow: boolean;
  /** Config root relative to the git root (posix, empty at the top level). */
  root: string;
  /** `origin`; `webUrl` is set for GitHub, GitLab and Bitbucket remotes. */
  remote?: { url: string; webUrl?: string };
};

export type FileHistory = {
  /** First commit touching the file; `date` is ISO 8601. */
  created: { commit: string; date: string };
  /** Last commit touching the file. */
  updated: { commit: string; date: string };
};
