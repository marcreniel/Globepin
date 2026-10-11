# Clustering tests

Use Node 24.8.0 (`nvm use` from the repository root), then run `npm test`.
The tests use Node's built-in test runner and native TypeScript stripping, so no
extra testing dependencies or running mobile app are needed. Older Node versions
without TypeScript stripping cannot load the utility.

These tests check the pure calculation. They do not mount React hooks or verify
native map layout. The existing project-wide TypeScript diagnostics are separate
from the calculation tests.
