# cameractrls #118

The GUI discovers PTZ controllers synchronously during startup. A helper that
never exits therefore prevents the first window from appearing and leaves the
application's D-Bus owner wedged.

The repair gives each helper probe a five-second bound, logs the skipped helper,
and continues with an empty result. Focused tests preserve normal output parsing
and prove timeout fallback. The same tests fail on the pinned baseline and pass
after the production patch.
