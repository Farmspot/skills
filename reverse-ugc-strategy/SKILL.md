---
name: reverse-ugc-strategy
description: >
  Reverse-engineer how an app runs its TikTok UGC farm, from Farmspot data, into a shareable HTML report: how the farm
  grew week by week (outliers, traffic, App Store ratings), who is on camera, what they post and what wins, how it
  compares with its niche, and a playbook to copy for the user's own app.
  Use when the user types /reverse-ugc-strategy <app>, or asks how an app (a competitor, a rival, "Cal AI", "Bitebro")
  runs its UGC farm, its TikTok creator accounts, its organic TikTok strategy, what content it posts, how it went
  viral, or how to copy a competitor's TikTok. Needs the Farmspot MCP connected (https://www.farmspot.ai/mcp).
  Do not use for paid ads libraries, Instagram or YouTube strategy, or for writing hooks only (that is /hooks).
metadata:
  requires:
    mcp:
      - farmspot
---

# /reverse-ugc-strategy

Turns Farmspot's data on one app's TikTok UGC farm into a report people want to share: the timeline of how the farm
was built, the accounts behind it, the content that wins, the niche around it, what it brought, and a playbook.

A **farm** is all of an app's creator accounts; one of them is an **account**. An **outlier** is a video at least 3×
its account's usual views. A **hit** is 100,000 views or more. Farmspot stores videos from 50,000 views only: every
count over videos is over those, and the report says so.

## Rules

- Every number comes from a tool call made in this run: Farmspot, or another connected source named in the block.
  Never estimate, round up a sample, or fill a gap from memory. A missing figure is shown as missing.
- Data, not prose: a chart or a figure before a sentence, one-line takeaways, no paragraphs.
- State only what the data shows. No guesses, no "probably", no reading between the lines: if a figure does not
  show it, leave it out. Never claim a farm caused downloads or traffic; put the two on the same timeline and let the
  reader see them.
- Give n for every pattern. Under 10 videos, write "too few to tell" instead of a rate.
- Link every video and account to its Farmspot `page`. TikTok links only if the user asks.
- Hooks and captions stay in their language; your own text is in the user's language.
- Plain words, no emojis, no em dashes.

## Steps

### 1. Check the account (free call)

Call `my_account`. It costs no call. Read:
- `plan`: **Growth** → full mode. Anything else (Free, Pro) → free mode. Their searches return at most 25 rows,
  and their calls are limited: `mcp_calls.left`.
- `workspace.products`: the user's own app (the `active` one). The playbook is written for it. If there is none,
  ask once: "Which app should the playbook be written for? (a name or a link; or skip)". Skip means a generic playbook.
- `workspace.competitors`: mention them at the end as next runs.

Tell the user the mode and the cost before spending: full mode uses 13 calls (two of them `sql`), free mode 5. If fewer calls are
left than the mode needs, say so and stop.

### 2. Find the app

Call `view_brand` with the name, or the `url` if the user gave a link. Keep the whole answer: it carries the
accounts, `daily_history`, `web_visits_by_month`, `pain_points`, `hook_formulas`, `concepts`, `content_mix`,
`top_videos`, `niche_brands`, `similar_brands`, and the taxonomy under `brand`.

If it answers `not_tracked` (or no farm accounts): stop. Say Farmspot does not track this app's farm yet, show the
closest tracked brands it returned, offer to run the report on one of them, and give the link to request the brand
(https://www.farmspot.ai/brands, "Request a brand"). Never build a report on an app without a farm.

### 3. Collect the rest

Run the calls in `references/data.md`, for the mode chosen. They are listed with their exact filters. Do not add
calls the mode does not list.

### 4. Compose the report

Read `references/report-data.md`. The shell is fixed (header, banner, verdict, method, footer); the sections are
yours. Decide what this farm's story is and compose 4 to 6 sections of blocks that show it. A usual run has:
how the farm grew (timeline), who posts (the farm), what wins (content), against the niche, and the playbook, but
drop a section the data can't fill and add one when the data shows something else (a paid push, a launch, one
account that is the whole farm). Use the other tools the user has connected where they explain the farm, each
labelled with its source.

The report is data, not prose: charts and figures, one line of takeaway per block, no paragraph anywhere. Open with
the verdict and 4 to 6 tiles; make the timeline one `panels` block (one measure per panel, one under the other);
compare competitors on the same scale. Section titles state the finding, not the topic.

Write the playbook last, as an `actions` block, from the evidence above it:
- Full mode: 5 actions, then 3 things to skip as a `notes` block. Free mode: 3 actions and a `locked` line.
- Each action is something the user's app can start this week: a short title, the figure that justifies it (`why`,
  one line, with n), the video that shows it (`evidence`), START, EFFORT (low, medium, high), WATCH (the number to
  follow), and a `prompt` ready to paste into an agent: it names the user's app, the format, the hook formula with its
  slots, and asks for 5 scripts.

### 5. Render

Save two files in the working directory (or the place the user named):
- `reverse-ugc-strategy-<brand-slug>.json`: the data.
- `reverse-ugc-strategy-<brand-slug>.html`: `assets/report.html` with `__REPORT_DATA__` replaced by the JSON.

With a shell and Node: `node <skill dir>/scripts/render.mjs <data.json> <out.html>`. It does the replacement and
escapes `<`. Without one, do it by hand: put the JSON in place of `__REPORT_DATA__` and write every `<` inside the
JSON as the six characters backslash, u, 0, 0, 3, c.

On claude.ai or the desktop app, also publish the HTML as an artifact if the host offers it. Covers load from
cdn.farmspot.ai; if the host blocks outside images, the report still reads (covers hide themselves).

### 6. Answer in the chat

Five lines at most: the verdict in one sentence, the three findings that matter most (each with n and a link), the
path to the report, then the next step: "Next: `/hooks <your app>` writes opening lines on the formulas that win
here." In free mode, add one line: what the full report would add, and https://www.farmspot.ai/billing.
