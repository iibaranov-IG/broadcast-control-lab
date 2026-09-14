import importlib.util
import os
import pathlib
import subprocess
import sys

source = pathlib.Path(sys.argv[1]).resolve()
os.chdir(source)
sys.path.insert(0, str(source / "lib" / "kconfiglib"))

import kconfiglib

subprocess.run(["bash", "scripts/find-firmware-extras.sh"], check=True)
kconfig = str(source / "src" / "Kconfig")
initial = kconfiglib.Kconfig(kconfig, suppress_traceback=True)
initial.load_config(str(source / "test" / "configs" / "stm32f446.config"))
initial.syms["LOW_LEVEL_OPTIONS"].set_value(2)
initial.syms["STM32_USB_PA11_PA12"].set_value(2)
config = source / ".bcl-usb-product.config"
initial.write_config(str(config), save_old=False)

changed = kconfiglib.Kconfig(kconfig, suppress_traceback=True)
changed.load_config(str(config))
previous = (
    changed.syms["MCU"].str_value,
    changed.syms["USB_PRODUCT"].str_value,
)
changed.syms["MACH_RPXXXX"].set_value(2)
changed.syms["RPXXXX_USB"].set_value(2)

helper = source / "scripts" / "kconfig.py"
if helper.exists():
    spec = importlib.util.spec_from_file_location("kalico_kconfig", helper)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.update_automatic_usb_product(changed, previous)

result = (
    changed.syms["MCU"].str_value,
    changed.syms["USB_PRODUCT"].str_value,
)
config.unlink(missing_ok=True)
if result != ("rp2040", "rp2040"):
    print(f"USB_PRODUCT_STALE: MCU={result[0]} USB_PRODUCT={result[1]}")
    raise SystemExit(1)
print("PASS: automatic USB product follows the selected RP2040 MCU")
