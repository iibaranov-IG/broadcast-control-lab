# c64cast audio teardown: existing PR validation

Revalidates [PR #387](https://github.com/kfox/c64cast/pull/387) for
[issue #368](https://github.com/kfox/c64cast/issues/368). It does not authorize a
new competing PR.

The tests-only patch is installed on the pinned baseline before production code
changes. BCL requires the named lifecycle regression to fail with its expected
assertion, applies the production/documentation patch, repeats the same regression
and executes complete upstream unittest discovery. Dependency acquisition follows
the pinned upstream uv.lock dev+web profile with wheel-only installation; upstream
code runs afterward in the offline container. Logs and skip counts describe this
Linux/Python 3.12 run, not the entire upstream CI platform matrix or hardware.
