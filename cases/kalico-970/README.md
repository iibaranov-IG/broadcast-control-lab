# Kalico USB product refresh

This case reproduces [Kalico issue #970](https://github.com/KalicoCrew/kalico/issues/970) at `6b1822bc76c54faaa1b95331d886a8b951330882`.

The negative control reloads an STM32F446 USB configuration and switches it to RP2040. The baseline leaves `USB_PRODUCT=stm32f446xx`. The candidate refreshes the automatic product to `rp2040`.

Five upstream unit tests cover the automatic path, an existing custom product, a custom product entered during the architecture switch, the saved menuconfig integration, and abandoning unsaved changes. Physical USB enumeration remains the owner's final check.
