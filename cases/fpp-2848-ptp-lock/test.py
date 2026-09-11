"""Compile the actual FPP cache/lock methods with stubbed pmc and logging.

No ptp4l process, network traffic, system clock writes or GStreamer pipeline.
"""
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import time

source = pathlib.Path(sys.argv[1])
report = {"evidence": "extracted upstream C++ methods, simulated pmc replies, UBSan",
          "hardwareVerified": False, "applicationVerified": False, "results": []}

def extract(text, signature):
    start = text.index(signature)
    # These upstream methods have their closing brace at column zero.
    end = text.index("\n}", start) + 2
    return text[start:end]

def translation(cpp, header):
    cache = re.search(r"    struct PtpQueryCache \{.*?\n    \};", header, re.S).group()
    constants = "\n".join(re.findall(r"constexpr [^\n]*\bPTP_(?:QUERY_CACHE_MS|LOCK_OFFSET_NS|LOCK_POLL_MS)\s*=[^;]*;", header))
    return r'''
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#define LogWarn(...) ((void)0)
#define LogInfo(...) ((void)0)
static const char* PMC_BINARY = "stub-pmc";
static bool FileExists(const char*) { return true; }
static std::string FormatPmcClockId(const std::string& s) { return s; }
namespace AES67 {
''' + constants + r'''
}
class AES67Manager {
public:
''' + cache + r'''
    PtpQueryCache m_ptpCache;
    std::mutex m_ptpCacheMutex;
    std::string reply, state;
    bool IsPtp4lRunning() { return true; }
    int GetPtpDomain() { return 0; }
    std::string RunPmcQuery(const std::string& q, int) {
        return q == "GET TIME_STATUS_NP" ? reply : "portState " + state;
    }
    void RefreshPtpCache(bool force = false);
    bool WaitForPtpLock(int timeoutMs);
};
''' + "\n".join(extract(cpp, sig) for sig in (
        "static bool IsGrandmasterPortState(",
        "void AES67Manager::RefreshPtpCache(",
        "bool AES67Manager::WaitForPtpLock(")) + r'''
int main(int argc, char** argv) {
    if (argc != 4) return 2;
    AES67Manager m;
    m.state = argv[1];
    // A prior good cache must not leak into a failed subsequent query.
    m.reply = "gmPresent true\nmaster_offset 0\n";
    m.RefreshPtpCache(true);
    m.reply = argv[2];
    bool actual = m.WaitForPtpLock(1);
    std::cout << (actual ? "locked" : "unsettled") << "\n";
    return actual == (std::string(argv[3]) == "1") ? 0 : 1;
}
'''

def record(name, callback):
    start = time.monotonic()
    result = {"name": name, "status": "PASS"}
    try:
        callback()
    except Exception as error:
        result.update(status="FAIL", message=str(error))
    result["durationMs"] = round((time.monotonic() - start) * 1000, 3)
    report["results"].append(result)

def check(binary, state, reply, expected):
    run = subprocess.run([str(binary), state, reply, str(int(expected))], capture_output=True, text=True, timeout=5)
    assert run.returncode == 0, f"expected {expected}: {run.stdout} {run.stderr} (exit {run.returncode})"

with tempfile.TemporaryDirectory(prefix="bcl-fpp-lock-") as temp:
    temp = pathlib.Path(temp)
    binaries = {}
    for label in ("baseline", "candidate"):
        files = []
        for ext in ("cpp", "h"):
            path = f"src/mediaoutput/AES67Manager.{ext}"
            files.append(subprocess.check_output(["git", "-C", str(source), "show", "HEAD:" + path], text=True)
                         if label == "baseline" else (source / path).read_text())
        unit = temp / (label + ".cpp")
        unit.write_text(translation(*files))
        binary = temp / label
        subprocess.run(["c++", "-std=c++17", "-pthread", "-fsanitize=undefined", "-fno-sanitize-recover=undefined", str(unit), "-o", str(binary)], check=True)
        binaries[label] = binary
    record("Negative control: baseline falsely locks with missing offset", lambda: check(binaries["baseline"], "SLAVE", "gmPresent true\n", True))
    record("Negative control: baseline treats failed query as no grandmaster", lambda: check(binaries["baseline"], "LISTENING", "", True))
    for name, state, reply, expected in [
        ("Missing offset", "SLAVE", "gmPresent true\n", False),
        ("Empty offset", "SLAVE", "gmPresent true\nmaster_offset\n", False),
        ("Nonnumeric offset", "SLAVE", "gmPresent true\nmaster_offset unavailable\n", False),
        ("Numeric prefix is not a valid offset", "SLAVE", "gmPresent true\nmaster_offset 0oops\n", False),
        ("Out-of-range offset", "SLAVE", "gmPresent true\nmaster_offset 999999999999999999999999\n", False),
        ("INT64_MIN does not overflow", "SLAVE", "gmPresent true\nmaster_offset -9223372036854775808\n", False),
        ("INT64_MAX stays unsettled", "SLAVE", "gmPresent true\nmaster_offset 9223372036854775807\n", False),
        ("Missing grandmaster field", "SLAVE", "master_offset 0\n", False),
        ("Absent grandmaster", "SLAVE", "gmPresent false\nmaster_offset 0\n", False),
        ("Malformed grandmaster field", "SLAVE", "gmPresent unknown\nmaster_offset 0\n", False),
        ("Failed query while listening", "LISTENING", "", False),
        ("Malformed query while listening", "LISTENING", "gmPresent unknown\n", False),
        ("Explicit no grandmaster at deadline", "LISTENING", "gmPresent false\n", True),
        ("Grandmaster still present while listening", "LISTENING", "gmPresent true\n", False),
        ("Zero offset locks", "SLAVE", "gmPresent true\nmaster_offset 0\n", True),
        ("Positive offset inside tolerance", "SLAVE", "gmPresent true\nmaster_offset +999999\n", True),
        ("Negative offset inside tolerance", "SLAVE", "gmPresent true\nmaster_offset -999999\n", True),
        ("Positive boundary does not lock", "SLAVE", "gmPresent true\nmaster_offset 1000000\n", False),
        ("Negative boundary does not lock", "SLAVE", "gmPresent true\nmaster_offset -1000000\n", False),
        ("Master role preserved", "MASTER", "", True),
        ("Grandmaster role preserved", "GRAND_MASTER", "", True),
        ("Premaster remains transitional", "PRE_MASTER", "gmPresent false\n", False),
        ("Uncalibrated is not locked", "UNCALIBRATED", "gmPresent true\nmaster_offset 0\n", False),
    ]:
        record(name, lambda s=state, r=reply, e=expected: check(binaries["candidate"], s, r, e))

pathlib.Path("reports").mkdir(exist_ok=True)
pathlib.Path("reports/fpp-2848-ptp-lock.json").write_text(json.dumps(report, indent=2) + "\n")
for result in report["results"]:
    print(result["status"], result["name"], result.get("message", ""))
sys.exit(any(r["status"] == "FAIL" for r in report["results"]))
