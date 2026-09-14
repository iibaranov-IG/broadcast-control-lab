# Candidate selection and delivery readiness

Run `bcl triage` before selecting a new repair. It inventories contribution rules
(`AGENTS.md`, contributing guides and PR templates), reads up to twenty files at
the pinned revision, and saves their contents and requirement hints. Hints need
human interpretation: a matching word does not establish a mandatory rule.

`selection-policy.json` lists denied owners and repositories. Bitfocus is always
excluded from selection and publication. Explicit active related PRs and missing
license metadata/files in a complete tree reject selection. Other exclusions need
an evidence-backed assessment; the tool never infers that an issue is artificial
or a maintainer is unwilling merely from sparse activity.

```sh
npm run bcl -- triage https://github.com/owner/project/issues/123 --assessment assessment.json
```

An assessment is bound to `issue` (the canonical URL) and `sourceCommit` (the SHA
reported by triage). Stale revisions are rejected. It contains:

- `gates`: `allowedProject`, `nonSecurity`, `organicIssue`, `sourceAvailable`,
  `licenseAvailable`, `unclaimed`, `resourcesAvailable`, `externalChangesWelcome`.
  Each needs `{ "status": "PASS", "reason": "...", "evidence": ["source URL or reviewed record"] }`.
  Use `REJECT` for an established exclusion or `UNKNOWN` for missing information.
- `dimensions`: the twelve names below, each with integer `value` from 0 to 5,
  `reason` and `evidence`. Higher always means more favorable: small scope, cheap
  verification and low risk score higher.
- `delivery`: integer 0..5 values for `ownerContact`, `acceptancePath` and
  `validationAccess`, plus `reason` and `evidence`.

| Dimension | Weight |
| --- | ---: |
| `ownerPain` | 12 |
| `freshness` | 6 |
| `ownerAvailability` | 12 |
| `resultClarity` | 10 |
| `reproducibility` | 12 |
| `repairSize` | 7 |
| `verificationCost` | 7 |
| `regressionRisk` | 8 |
| `projectActivity` | 7 |
| `communityValue` | 7 |
| `reuse` | 6 |
| `cascade` | 6 |

The weighted score is 0..100. Classes: 85–100 `TAKE_NOW`, 70–84 `QUICK_REVIEW`,
50–69 `RESERVE`, below 50 `SKIP`. Any exclusion overrides scores. Unknown inputs
produce a score range and `NEEDS_REVIEW`, never invented points or eligibility.

Delivery readiness weights contact 35%, acceptance path 40% and validation access
25%. The queue key orders freshness first, then delivery readiness and candidate
score. This measures repair response to a live owner problem: a recent report with
an available owner is handled before an equally suitable archival issue. SKIP and
RESERVE have no queue key and are not eligible for automatic execution.
This is a prioritization index, **not a calibrated probability of merge**;
`deliveryProbability` remains null until outcome history supports calibration.

The `nonSecurity` gate excludes security/vulnerability work and Daybreak. The
resources gate excludes required secrets, closed SDKs and unavailable necessary
equipment. The organic-issue gate rejects activity farming; unclaimed rejects
occupied work; external-changes-welcome rejects explicit refusals. Evidence and
human review are required for these judgments. A high score never overrides them.
