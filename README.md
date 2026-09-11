# Broadcast Control Lab

**Reproduce the problem. Test the repair. Keep the evidence.**

Broadcast Control Lab (BCL) is an independent engineering lab for broadcast,
audio, video and equipment-control software. We turn concrete user problems into
repeatable checks, focused repairs and test builds where a case supports packaging.
Each investigation adds reusable tools for the next one.

[Report a problem](https://github.com/iibaranov-IG/broadcast-control-lab/issues/new?template=repair-request.yml) ·
[Browse repairs](REPAIRS.md) ·
[Get builds and reports](https://github.com/iibaranov-IG/broadcast-control-lab/actions)

## What you can do with BCL

Read the [batch and evidence guide](docs/batch-and-evidence.md),
[candidate ranking policy](docs/candidate-ranking.md), and
[remaining delivery work](docs/ROADMAP.md). New repair runs require explicit
upstream red → green evidence; existing contract-only diagnostics remain labeled
and cannot qualify a new publication.

| Your task | What BCL provides today |
| --- | --- |
| Review an issue before cloning or building | [`bcl triage`](docs/triage.md): source metadata, related PRs, dependency hints and a decision with evidence links |
| Reproduce a control-software failure without owning the device | Scripted TCP and UDP endpoints with controlled replies |
| Check behavior when replies arrive in pieces or late | TCP chunks and delays; UDP delayed or omitted replies |
| Check commands at the wire boundary | Captured traffic; exact binary datagram matching for UDP |
| Keep a repair from regressing | Executable checks against pinned source revisions |
| Share a candidate with someone who has the equipment | Case-specific test package, where packaging is implemented |
| Explain what was tested | JSON results, packet transcripts where available, and a generated Markdown report for passport-driven runs |
| Bring an unresolved equipment-control problem | A structured repair request and a public record of findings |

BCL is useful to equipment owners, broadcast engineers, integrators and software
maintainers. The socket tools work independently of a particular control
application. Current cases include Companion modules and an AutoPTZ backend.

## Start with an existing case

| Case | What is checked | Available output |
| --- | --- | --- |
| [ATEN variable crosspoints](cases/aten-2029/) | Variable expansion, port validation, saved numeric options and profile recall; 7 action-contract checks | Candidate module package, passport and evidence bundle |
| [AutoPTZ VISCA-over-UDP](cases/autoptz-155/) | Actual Python backend over loopback UDP: stop packets, complete Sony-framed reply, short reply and timeout; 4 checks | Reproducible diagnostic and packet transcript |
| [Intelix DIGI-88FS](cases/intelix/case.json) | Routing commands, fragmented input, login prompts and disconnected behavior | Independent regression evidence bundle |
| [Sennheiser TCC2](cases/tcc2/case.json) | SSC errors, valid state, malformed JSON and camera-sector boundaries | Independent regression evidence bundle |
| [Zynthian OSC source ports](cases/zynthian-1530/) | Two clients on one host receive feedback on their own ports | Native loopback check, source-patch archive and evidence |
| [MIDIMonster OSC mixer queries](cases/midimonster-150/) | Value-less XAir/X32 state requests and ordinary float output | Real core/backend build, exact UDP transcript and evidence |
| [FADER_X X Air mappings](cases/fader-x-5/) | Mixer-specific Aux, FX Return and Matrix address selection; 3 checks | Compiled production mapper, firmware contract checks and owner kit |
| [FPP PTP lock evidence](cases/fpp-2848-ptp-lock/) | Missing/malformed management replies, lock boundaries and integer extremes | Candidate patch and 25 C++ checks; the 1970-date issue remains open |
| [OBS PTZ DataVideo framing](cases/obs-ptz-144/) | DataVideo length-prefixed VISCA/TCP commands, fragmented replies and unchanged raw VISCA | Compiled production framer, integration contract checks and owner kit |
| [OLA KiNET isolation](cases/ola-1850/) | Non-blocking KiNET socket setup and preserved packet tests | Kernel flag probe, source contract and owner kit |
| [PiPedal Bluetooth MIDI reconnect](cases/pipedal-472/) | ALSA client-before-port hotplug ordering and stable-name rebinding | Deterministic event model, production contract and owner kit |
| [OLA RDM interface list](cases/ola-2037/) | Duplicate OS interface indices are collapsed before packing `LIST_INTERFACES` | Compiled response model, upstream regression contract and owner kit |
| [OLA Python reconnect callback](cases/ola-2031/) | `ClientWrapper` exposes one-shot socket closure notification when `olad` restarts | Production constructor probe, teardown contract and owner kit |
| c64cast speed series [#368](cases/c64cast-368/), [#369](cases/c64cast-369/), [#370](cases/c64cast-370/), [#371](cases/c64cast-371/), [#373](cases/c64cast-373/), [#374](cases/c64cast-374/), [#375](cases/c64cast-375/), [#377](cases/c64cast-377/), [#378](cases/c64cast-378/) | Nine focused MIDI, audio, VIC, lifecycle, test and documentation repairs | Pinned patches, Python syntax checks, repair-specific contracts and upstream PR links |
| [ToneTrace export defaults](cases/tonetrace-71/) | Source-derived MIDI filename and remembered export directory | Pinned patch, source contract, offscreen GUI evidence and upstream PR link |

All cases use v2 passports and one CI workflow. A case can be a diagnostic
or produce a package. Different coverage levels remain explicit in each passport.

## Get a test build or report

For a configured repair, `bcl test <id>` builds and tests it, `bcl publish <id>`
creates a draft PR from its successful Actions evidence, and `bcl hardware-kit <id>`
prepares the owner's check instructions and result form. See the
[publication guide](docs/publication.md) for configuration and exact commands.

1. Open [GitHub Actions](https://github.com/iibaranov-IG/broadcast-control-lab/actions).
2. Choose a successful run for the case and revision you want.
3. Download the artifacts at the bottom of the run page. GitHub may require sign-in.

The **BCL v2** workflow produces one `<case-id>-evidence` artifact per case.
It contains `case.json`, `evidence.json`, `PR-REPORT.md`, the raw test report,
separate packet transcripts when available, and any package produced by the case.

Evidence includes source revisions, runtime versions, the container image ID,
stage/test durations, SHA-256 hashes of packages and exchange logs, and remaining
owner checks. Setup and execution errors produce FAIL evidence where the runner
can still write; cancelled jobs and runner loss may leave only Actions logs. Artifacts expire
according to the retention date shown by GitHub; save the exact build you test.

## Run the lab yourself

You need Git, Node.js 22+ and Docker on Linux (or the provided GitHub Actions
runner). Docker supplies the pinned Node/Python runtime and native compiler.
The first run downloads sources and builds a runtime image.

```bash
git clone https://github.com/iibaranov-IG/broadcast-control-lab.git
cd broadcast-control-lab

npm link
bcl list
bcl run autoptz-155
bcl run aten-2029
bcl harness
```

Without linking, use `node scripts/bcl.cjs run <id>`. Results appear in
`reports/<id>/`. Fresh source checkouts are staged automatically and removed
after execution. AutoPTZ runs its backend without the full application or ML stack.
`npm test` runs BCL's own infrastructure unit tests; use `bcl run` for external cases.

PRs select affected cases from changed paths. Shared runner, library, workflow or
test changes run all cases. Pushes to main, manual runs and the nightly run
(02:17 UTC) run the full matrix. Superseded runs are cancelled. See
[the single workflow](.github/workflows/bcl.yml).

## Build your own case

Use `bcl new <issue-url> --template cpp|node|python --protocol tcp|udp|none`
for a language and transport starter. Publication now registers the PR on the
repair board; an hourly workflow reads CI and replies. See the
[automation guide](docs/automation.md) for retries, inbox commands and hardware-result import.

A [case passport](cases/README.md) records the problem, source issue, reproduction,
acceptance criteria, immutable source revision, runtime, commands, artifacts and
remaining hardware checks. Start with [ATEN's passport](cases/aten-2029/case.json).

```bash
bcl new https://github.com/owner/repo/issues/123
bcl validate aten-2029
```

`bcl new` uses `GH_TOKEN`, then `GITHUB_TOKEN`, then an existing `gh auth login`
session for github.com. Without credentials it falls back to anonymous reads.
Credentials stay in memory and are never written into the passport. For batches,
authenticate first. Rate limits use `Retry-After` or the reset timestamp, wait up
to one hour in total, and resume the same read (at most three rate-limit retries).
Permission denials are not retried.

`bcl new` reads a public GitHub issue, pins the issue repository's current commit,
and creates a draft passport, a failing test placeholder, a README and a report
template. It will not overwrite a case. Check that the issue repository is the
actual code repository; then implement the negative control and repair acceptance,
review dependencies, and set status to `ready`. A scaffold is not a reproduced bug.
The runner does not invent fixes. Use the explicit `bcl publish` command to publish
a configured, tested candidate as a draft PR.

Source/dependency acquisition happens before execution. Test and build commands
run with Docker `--network=none`, no host credentials, no Docker socket, dropped
capabilities and resource limits. Local TCP/UDP works inside that container.
Dependency acquisition currently has one audited, script-disabled registry recipe
for ATEN; new dependency recipes require review. See [v2 design and limits](docs/bcl-v2.md).

Use [ScriptedTcpDevice](lib/scripted-tcp-device.mjs) for stream interactions and
[ScriptedUdpDevice](lib/scripted-udp-device.mjs) for whole datagrams.
The [UDP guide](docs/udp-harness.md) explains scenario construction.
TCP listens on loopback by default; the UDP helper is restricted to loopback.
Use synthetic captures: UDP hex transcripts preserve the exact payload bytes.

## Bring us a problem

[Open a repair request](https://github.com/iibaranov-IG/broadcast-control-lab/issues/new?template=repair-request.yml)
with the device model, firmware/application version, reproduction steps, expected
and observed behavior, and relevant logs or protocol references. Tell us whether
you can test a candidate on the affected equipment. Remove credentials and private
data before posting.

If you already tried a BCL build, reply with its case/build identity, your setup,
the steps you ran and the result. A useful hardware report lets the next person
understand exactly which combination worked.

## What a green result means

A green run means the listed automated checks passed for the recorded revision.
Physical hardware and full application UI validation are separate evidence.
Current stand results must not be presented as hardware certification. Try
candidate builds in a separate setup before using them in an on-air workflow.

Protocol-specific device profiles, a turnkey client installer and an autonomous
issue-to-PR service are future work. BCL currently provides working engineering
tools and specific repair cases. It is an independent project; community builds
are not official releases from the affected software or equipment vendors.

See the [repair board](REPAIRS.md) for external contributions and their status,
and [diagnostic findings](FINDINGS.md) for the first reproduced defects.
