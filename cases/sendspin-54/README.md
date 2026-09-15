# Sendspin ALSA recovery clock

Revalidates [PR #55](https://github.com/Sendspin/sendspin-cpp-cli/pull/55) for the fresh USB-DAC report in [issue #54](https://github.com/Sendspin/sendspin-cpp-cli/issues/54).

The negative control models the observed 14-second gap at 48 kHz. The baseline cannot account for the 672,000 frames accepted while the DAC was absent. The candidate returns that gap once, prevents overflow on unusually long outages, and reports the gap before normal ALSA timing resumes. Physical replug verification remains assigned to the reporter's OpenWrt hardware.
