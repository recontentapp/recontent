// Tests create throwaway repositories and commit in them. Ignore the
// developer's own git configuration so that, for example, `commit.gpgsign`
// cannot make a test wait forever for a passphrase prompt.
//
// This runs as Jest's `globalSetup`, in the real parent process before the
// workers are forked: assigning to `process.env` inside a test sandbox never
// reaches the `git` processes the tests spawn.
export default function isolateGit(): void {
  process.env.GIT_CONFIG_GLOBAL = "/dev/null";
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  process.env.GIT_TERMINAL_PROMPT = "0";
}
