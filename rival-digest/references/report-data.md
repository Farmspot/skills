# Report data: a fixed shell, sections of blocks you choose

`assets/report.html` draws a fixed shell (header, partial-data banner, verdict with tiles, method, footer) and, between
them, the `sections` you compose from the blocks below. You decide which sections, in what order, and which blocks:
show what the data says about this app, not a checklist.

**Data, not prose.** A chart or a number beats a sentence. Text fields are one line: `verdict.text` ≤ 25 words,
`insight` ≤ 15 words. `**words**` become the lime highlight; one or two per line, on the figure.

**Titles state the finding.** A section title is the conclusion ("3 accounts make 38% of the views"), never a topic
("The farm"). A block title names what is drawn; its `insight` says what to see.

**Raw rows in, the page computes.** Never bin by week, sum or rank yourself: give dated rows and the page buckets them
(Monday UTC), draws the axes, marks the current week as still counting, and computes each panel's change.

## Shell

```json
{
  "meta": { "brand": "PagePilot", "brand_page": "https://www.farmspot.ai/brands/pagepilot", "icon": "…",
            "category": "Stores & dropshipping", "niche": "AI store builder", "generated_at": "2026-11-25T01:00:00Z",
            "range": { "from": "2026-05-25", "to": "2026-11-24" }, "mode": "full",      // "full" | "free"
            "partial_note": "Free calls read 25 rows a search: …",                      // free mode
            "sources": ["Farmspot", "Similarweb (via Farmspot)"], "calls_used": 12,
            "kicker": "Reverse-engineered UGC strategy", "title_suffix": ": how the farm works",
            "skill": "/reverse-ugc-strategy" },  // the command named in the footer  // the label above
                                                                     // the title, and what follows the brand in it
  "verdict": { "text": "A **volume farm**: …", "tiles": [ tile, … ] },                 // 4 to 6 tiles
  "sections": [ { "kicker": "Part 1 · Timeline", "title": "the finding", "insight": "one line",
                  "blocks": [ … ], "locked": "free mode: what Growth adds here, one line" } ],
  "next": { "text": "10 opening lines on these formulas.", "command": "/hooks Dropmagic" },
  "method": { "lines": [ "Sources, date, mode, caps, definitions: short lines." ] }
}
```

A `tile` is `{ label, value, delta, delta_label, spark, rank, sub, tone }`: `value` a number (formatted by the page) or
a display string; `delta` a fraction (0.31 = +31%), compared like the panels (last full week against 4 weeks before);
`spark` 8 to 13 numbers, oldest first; `rank` "#1 of 13"; `tone` "lime" for the headline tile.

A `video` is `{ page, cover, views, posted_at, handle, brand, hook, format, ratio }` (ratio = account_ratio).
Every block takes `title`, `insight`, `source` (the call it came from), and `width`
(`"half"`, `"third"`, or full). Tables, matrices and anything with more than 3 columns stay full width.

## Blocks

| type | fields | use it for |
|---|---|---|
| `panels` | `panels: [{name, unit, kind, agg, points: [{date, value, label, highlight}], tracked_from, tone, highlight, source}]`, `markers: [{date, label}]`, `from`, `to`, `shared_scale`, `complete` (every point is already a full 7 days: the current week is not hatched), `panel_height`, `note` | **the timeline.** One measure per panel, stacked on one week axis with its own y axis, the last full week and its 4-week change at the right, one hover line through all panels. `kind`: `bars` (counts), `line` (levels), `step` (a monthly figure), `dots` (one dot per row: accounts starting), `spans` (`rows: [{name, cover, link, first_seen, last_seen, videos, hits, points: [{date, value, hits}]}]`: one row per concept or hook formula, its cover, a line from its first to its last video, a dot per week sized by its videos, lime when half or more hit). `agg`: `sum`, `count`, `last`, `max`, `diff` (weekly gain of a running count, such as App Store ratings). `tracked_from`: earlier weeks show "not tracked", never 0. With `shared_scale: true` and one panel per brand it compares competitors on the same scale (`highlight: true` on the app). |
| `tiles` | `items: [tile]` | headline figures inside a section (the verdict has its own) |
| `dots` | `rows: [{name, note, format: "pct", log, values: [{name, value, self}]}]` | the app against every brand of its niche, one row per measure, with its rank; log scale by default when values spread past 50× |
| `curve` | `rows: [{name, value}]`, `marks: [1, 3, 10]`, `x_label` | concentration: cumulative share of views by accounts, biggest first; says how many make half |
| `table` | `rows: [{name, n, hit_rate, median, link}]`, `reference`, `min_n`, `name_label` | formats, hook types, CTAs: share, hit rate and median as bars, the median against `reference` (the app's median); rows under `min_n` (10) read "too few to tell" |
| `ranked` | `rows: [{name, value, value_label, sub, link, highlight: "win"\|"self"}]` | top accounts, top competitors on one measure |
| `share` | `rows: [{name, value, link}]`, `top` | one split: views by language, persona, presenter |
| `matrix` | `cells: [{row, col, value, label, n}]`, `rows`, `cols`, `scale: "rate"`, `self` | competitors × format |
| `covers` | `videos: [video]` | best videos, a niche's winners |
| `breakdown` | `video`, `duration_s`, `beats: [{start, end, label, text}]`, `brief: [{label, value}]`, `copy` | one winner on its own timeline (a label with "app" or "reveal" is drawn lime, "Hook" pink); `brief` adds label/value rows under it, `copy` a text to copy (a creator brief) |
| `hooks` | `items: [{formula, n, hits, median, original, link, handle, views, yours: [text]}]` | hooks to steal: the formula, its best original as written, and versions for the user's app, each with a copy button |
| `formulas` | `items: [{template, videos, hits, median, top_video}]` | hook formulas and concepts with [slots] |
| `actions` | `items: [{title, why, evidence, start, effort, watch, prompt}]` | the playbook |
| `notes` | `items: [{date, text, tag, link}]` | 2 to 4 dated moments, or the things to skip |
| `big` | `label, value, sub` | one figure that is the finding |

## Charts that read

- One measure per panel, one kind of mark per panel: bars for counts, lines for levels. Never two scales on one chart.
- Put the events on the timeline as `markers` (first account, a peak week, a burst of new accounts, a launch): the
  page draws them through every panel.
- Compare competitors one under the other on the same scale (`panels` with `shared_scale`), or as `dots`, never as a
  pile of colours.
- Say where the data stops: `tracked_from` for history that starts late, the current week is hatched for you, and
  the method says when a search was capped ("returned 200 of 215").

## Other sources

If the user has other tools connected (an ads library, analytics, App Store or web traffic tools, a web search),
use them where they explain the farm: paid ads running beside the outliers, launches and press, traffic. Each becomes
a panel (with `source`) or its own block, and is listed in `meta.sources`. Farmspot stays the core. Never present one
source's figure as another's, and never claim a cause: show the series side by side.
