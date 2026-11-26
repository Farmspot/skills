---
name: rival-digest
description: >
  A weekly digest of the user's competitors' TikTok UGC farms, from Farmspot data, as a shareable HTML report: who
  gained views, who added accounts, their best new videos turned into briefs for the user's creators, the hooks to
  steal, the creator profiles to recruit, the video ideas they started, the formats they bet on, and the brands of
  the niche the user does not follow yet.
  Use when the user types /rival-digest, or asks what their competitors or rivals did this week on TikTok, for a
  competitor update, a weekly competitive report, or "what's new with my competitors". Reads the competitors saved
  in the user's Farmspot workspace; offers to add some when there are none.
  Needs the Farmspot MCP connected (https://www.farmspot.ai/mcp).
  Do not use for one app's whole strategy (that is /reverse-ugc-strategy) or for paid ads.
metadata:
  requires:
    mcp:
      - farmspot
---

# /rival-digest

What the user's competitors did on TikTok over the last 7 days (or the range the user gives, up to 30), read
against the weeks before: a scoreboard, the moves, the videos, and who else in the niche is growing.

A **farm** is all of an app's creator accounts; one of them is an **account**. A **hit** is 100,000 views or more.
Farmspot stores videos from 50,000 views only: every count over videos is over those, and the report says so.
**Views gained** count every post of the farm (daily scans), stored or not: lead with them.

## Rules

- Every number comes from a tool call made in this run. Never estimate or fill a gap from memory; a missing figure
  is shown as missing.
- Data, not prose: a chart or a figure before a sentence, one-line takeaways, no paragraphs.
- State only what the data shows. No guesses, no "probably", no reading of intent ("they are pivoting to…"). Show
  the change and its size; the reader draws the conclusion.
- Give n for every pattern. Under 10 videos, write "too few to tell" instead of a rate.
- Link every brand, video and account to its Farmspot `page`. TikTok links only if the user asks.
- Hooks and captions stay in their language; your own text is in the user's language.
- Plain words, no emojis, no em dashes.

## Steps

### 1. Read the workspace (free call)

Call `my_account`. Read:
- `plan`: **Growth** → full mode. Anything else → free mode (searches return at most 25 rows; no `sql`).
- `workspace.products`: the user's app (the `active` one; `in_library_as` is its Farmspot name).
- `workspace.competitors`: the rivals. Drop the user's own app from the list if it is there.

No product in the workspace: ask once, "Which app is yours? Send its website or store link and I'll save it to your
workspace." With a link, call `edit_workspace` with `add_product` and `url` (no MCP call; it reads the page into a
product sheet and makes it the active product), then use it. With a name only, use it for this run and say a link
would save it. "skip": run without an app (the briefs are then written for "your app").

Tell the user the mode and the cost before spending: full mode uses 14 calls (3 `sql`, 3 `view_post`), free mode 5.
If fewer calls are left (`mcp_calls.left`), say so and stop.

### 2. Few or no competitors: propose some

If `workspace.competitors` holds fewer than 3 rivals (after dropping the user's app):
1. Call `view_brand` on the user's app (it is call 2 of the run anyway).
2. Propose up to 8 brands not followed yet, numbered, each with one line of figures (accounts, views gained in 30
   days, hits): first `niche_brands` with a farm, by views gained, then `similar_brands` if fewer than 8.
3. Ask: "Which should I follow? (numbers, all, or skip)". Wait for the answer.
4. For each one picked, call `edit_workspace` with `add_competitor` (it costs no call). Say they are saved to the
   workspace and every digest will use them, then go on with them. "skip" with no rivals at all: run this once on the
   top 5 of the niche, without saving, and say so.

### 3. Collect

Run the calls in `references/data.md` for the mode. Do not add calls the mode does not list.

### 4. Compose the report

Read `references/report-data.md` for the blocks. Set `meta.kicker` to "Rival digest", `meta.skill` to
"/rival-digest", `meta.brand` to the user's app (or "Your rivals" without one), `meta.title_suffix` to ": your
rivals this week", `meta.range` to the period. Sections in this order; drop one the data can't fill:

1. **Scoreboard**: the verdict names the rival that moved most and by how much. Tiles: rivals' views gained in the
   period (sum, with the change on the period before), accounts that started pitching, stored hits posted, new
   video ideas, the user's rank on views gained. Then `ranked` on views gained in 7 and in 30 days (the app `self`).
2. **What to shoot this week**: one `breakdown` per video of calls 12 to 14: its beats from the breakdown's scenes
   (label the first "Hook" and the one where the app shows "App reveal"), then `brief` rows (Format, Hook as said
   and as written, App: the second it is shown and named, CTA, Caption, all as the rival did it) and `copy`: the
   brief rewritten for the user's app, numbered by seconds, ready to send to a creator. The rival's figures stay
   the rival's; the rewrite changes only the product and its steps.
3. **Hooks to steal**: one `hooks` block from call 11: the 6 formulas with the most hits, each with its best
   original (kept in its language, linked), `n`, `hits`, `median`, and `yours`: three versions for the user's app
   (in the user's language, plus the original's language when it differs).
4. **Who to recruit**: from call 10, `share` of views gained by language, by presenter and by persona, then
   `ranked` of the 8 accounts to model on (`sub`: brand, language, region, presenter, persona, followers, posts a
   day, hits). Compare with the user's own accounts (`view_brand.accounts`) in one insight.
5. **The weeks**: one `panels` block, `shared_scale`, one `line` panel per brand (the app first, `highlight`) on
   weekly views gained, then the accounts starting per brand as `dots`. Markers on the weeks that jumped.
6. **What they posted**: `covers` of the best videos of the period, then `formulas` of the ideas first seen in the
   period and of the ideas they keep posting.
7. **How they post**: `matrix` brand × format (hit rate · median, n), 90 days.
8. **Outside your list**: `ranked` of the niche brands the user does not follow, by views gained in 30 days, then
   the brands closest to the app by what they do (`similar_brands`).

### 5. Render

Save in the working directory (or where the user said):
- `rival-digest-<YYYY-MM-DD>.json` and `.html`: `node <skill dir>/scripts/render.mjs <data.json> <out.html>`.
  Without Node, put the JSON in place of `__REPORT_DATA__` in `assets/report.html` and write every `<` inside the
  JSON as the six characters backslash, u, 0, 0, 3, c.
- `creator-brief-<YYYY-MM-DD>.md`: the three briefs (`copy`) and the hooks (`yours`), plain text, each brief with
  the link to the rival video it follows: the file the user sends to their creators.

On claude.ai or the desktop app, also publish the HTML as an artifact if the host offers it.

### 6. Answer in the chat

Five lines at most: the rival that moved most (figure and link), the brief to shoot first (one line and its link),
the paths to the report and the creator brief. Then two offers:
- "Farmspot also tracks these in your niche:" the 3 fastest-growing brands the user does not follow, numbered, one
  line of figures each, and "Add any to your competitors? (numbers)". On an answer, `edit_workspace`
  `add_competitor` for each, and say the next digest includes them.
- A teardown of the rival that moved most: "`/reverse-ugc-strategy <rival>` shows how its farm works."

End with: "Run it every Monday: ask your agent to schedule /rival-digest." In free mode, add what the full digest
adds and https://www.farmspot.ai/billing.
