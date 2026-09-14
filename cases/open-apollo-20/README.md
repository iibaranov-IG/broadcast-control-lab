# Open Apollo Debian 13 installer repair

Issue: https://github.com/rolotrealanis98/open-apollo/issues/20

The current Thunderbolt installer requests the retired `gir1.2-appindicator3-0.1` package. A clean Debian 13 container reproduces apt's `no installation candidate` error and returns failure from the dependency step.

The candidate selects `gir1.2-ayatanaappindicator3-0.1`, which provides the same `AppIndicator3` GI namespace. The same Debian 13 dependency transaction then succeeds. Package availability was also checked on the project's supported Ubuntu 20.04, 22.04, and 24.04 bases. The added shell regression protects the apt mapping, while the upstream install matrix exercises the complete installer.

No physical Apollo is required to prove this package-resolution defect. The issue owner should still run playback and capture checks after installing on the real interface.
