from pathlib import Path

source = Path.cwd()
stdlib = (source / "src/libs/extra/audioscrobbler.liq").read_text()
regression = (source / "tests/regression/GH5398.liq").read_text()
dune = (source / "tests/regression/dune.inc").read_text()
secure = '~base_url="https://ws.audioscrobbler.com/2.0"'
insecure = '~base_url="http://ws.audioscrobbler.com/2.0"'
if secure not in stdlib or insecure in stdlib:
    print("BUG_INSECURE_AUDIOSCROBBLER_URL")
    raise SystemExit(1)
assert secure in regression
assert "test_GH5398" in dune and "GH5398.liq" in dune
print("Ran 1 test")
