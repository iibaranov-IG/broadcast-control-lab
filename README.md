# Broadcast Control Lab

**Reproduce the problem. Test the repair. Keep the evidence.**

Broadcast Control Lab (BCL) is an independent engineering lab for broadcast,
audio, video and equipment-control software. We turn concrete user problems into
repeatable checks, focused repairs and test builds where a case supports packaging.
Each investigation adds reusable tools for the next one.

[Report a problem](https://github.com/iibaranov-IG/broadcast-control-lab/issues/new?template=repair-request.yml) ·
[Browse repairs](REPAIRS.md) ·
[Get builds and reports](https://github.com/iibaranov-IG/broadcast-control-lab/actions) ·
[Русская версия](README.ru.md)

## What you can do with BCL

| Your task | What BCL provides today |
| --- | --- |
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
| [Intelix DIGI-88FS](FINDINGS.md) | Routing commands, fragmented input, login prompts and disconnected behavior | Regression results in the main BCL report |
| [Sennheiser TCC2](FINDINGS.md) | SSC errors, valid state, malformed JSON and camera-sector boundaries | Regression results in the main BCL report |

ATEN uses the common executable passport pipeline. AutoPTZ currently has a
dedicated diagnostic workflow. Intelix and TCC2 share the original regression
suite. These are different levels of coverage, not claims of full device support.

## Get a test build or report

1. Open [GitHub Actions](https://github.com/iibaranov-IG/broadcast-control-lab/actions).
2. Choose a successful run for the case and revision you want.
3. Download the artifacts at the bottom of the run page. GitHub may require sign-in.

| Workflow | Artifacts |
| --- | --- |
| BCL case pipeline | `aten-2029-test-build` and `aten-2029-report` |
| BCL AutoPTZ UDP diagnostic | `autoptz-155-report` |
| Broadcast Control Lab | `lab-report` |

The ATEN report bundle includes a passport snapshot, `evidence.json` and
`PR-REPORT.md`: source revisions, stage/test results, package SHA-256 and remaining
owner checks. Failure evidence is written when an execution fails inside the case
runner. Workflow setup failures remain visible in Actions logs. Artifacts expire
according to the retention date shown by GitHub; save the exact build you test.

## Run the lab yourself

You need Git and Node.js 22+ for the lab tools. AutoPTZ's diagnostic also uses
Python 3.12. Individual package builds use the runtime pinned in their passport.

```bash
git clone https://github.com/iibaranov-IG/broadcast-control-lab.git
cd broadcast-control-lab

# Exercise the reusable TCP/UDP stand and evidence helper.
npm run test:harness

# Run ATEN action checks without installing Companion or connecting a matrix.
node cases/aten-2029/test.mjs

# Fetch the pinned AutoPTZ backend, then test it against the BCL UDP stand.
python3 cases/autoptz-155/prepare.py
node cases/autoptz-155/test.mjs
```

These focused commands do not require a full AutoPTZ installation or ML
dependencies. The AutoPTZ check isolates the backend and two unchanged dependencies.

`npm test` additionally requires Intelix and TCC2 source checkouts. Set
`LAB_SOURCES` to their parent directory, using the directory names `intelix` and
`tcc2` and the revisions in [the lab workflow](.github/workflows/lab.yml).
For the complete managed run, use Actions; a repository owner or fork owner can
start it with **Run workflow**.

## Build your own case

A [case passport](cases/README.md) records the problem, source issue, reproduction,
acceptance criteria, immutable source revision, runtime, commands, artifacts and
remaining hardware checks. Start with [ATEN's passport](cases/aten-2029/case.json).

```bash
node scripts/case.cjs list
node scripts/case.cjs validate aten-2029
```

To execute the complete case, prepare a fresh source checkout at the passport's
revision and directory, select its exact Node runtime, then run:

```bash
node scripts/case.cjs run aten-2029
```

The common workflow discovers `case.json` files automatically and runs preparation,
tests and packaging in order. New cases still need their own reproduction and
test logic; adding a passport alone does not implement a protocol.

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
