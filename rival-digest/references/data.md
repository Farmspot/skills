# The calls, by mode

`<rivals>` is the competitor names from `my_account` (without the user's app); `<app>` the user's app as
`in_library_as`. `<days>` is the period (7 by default). Each `search` returns `range`, `definitions` and `notes`:
keep the notes for the method line.

## Full mode (Growth): 14 calls

| # | Call | For |
|---|---|---|
| 1 | `my_account` (free) | mode, the app, the rivals |
| 2 | `view_brand {name: <app>}` | the app's niche, `niche_brands`, `similar_brands`; skip it when there is no app and use the first rival's |
| 3 | `search` brand, filters `name in [<app>, <rivals>]`, limit 50, select `id, name, page, niche, farms, farms_active, new_farms_30d, posts_7d, posts_30d, views_gained_7d, views_gained_30d, outliers_30d, hits, virality_rate, median_views, web_visits, app_ratings_added_30d` | the scoreboard, and the ids for the sql calls |
| 4 | `sql`: daily history per brand, 12 weeks (below) | the weekly panels |
| 5 | `sql`: accounts starting per brand (below) | accounts that started pitching, by week, language and persona |
| 6 | `search` post, filters `brand in [<rivals>]`, range `<days>` days, order `views desc`, limit 30, select `id, page, cover_url, views, posted_at, handle, brand, hook_text, format, hook_type, account_ratio, concept` | the best videos of the period |
| 7 | `sql`: the rivals' video ideas active in the period (below) | new and busy concepts |
| 8 | `search` post, filters `brand in [<app>, <rivals>]`, `labeled = true`, group_by `brand, format`, select `n, hits, hit_rate, median_views`, range 90 days, min_n 2, limit 100 | how each one posts |
| 9 | `search` brand, filters `niche in [<the niches of the app and the rivals>]`, `name not_in [<app>, <rivals>]`, `farms > 0`, order `views_gained_30d desc`, limit 10, select `name, page, niche, farms, farms_active, new_farms_30d, posts_7d, views_gained_7d, views_gained_30d, hits, web_visits, first_post_at` | the niche brands the user does not follow |
| 10 | `search` account, filters `brand in [<rivals>]`, order `views_gained_7d desc`, limit 15, select `handle, page, brand, presents_as, presenter, language, region, followers, posts_per_day, views_gained_7d, median_views, hits, first_pitch_at` | who to recruit |
| 11 | `search` post, filters `brand in [<rivals>]`, `hook_formula not_null`, group_by `hook_formula`, select `n, hits, hit_rate, median_views, examples`, range 30 days, min_n 1, order `hits desc`, limit 10 | hooks to steal |
| 12–14 | `view_post {id}` on the 3 best videos of call 6 that have a breakdown (`format` not null is a good sign; skip one whose `breakdown` is empty and take the next) | the creator briefs |

Call 4 (one row per brand, a day every 7 back from today packed as "YYYY-MM-DD accounts active views_gained_7d|…",
so each point is one full week ending on a run day; `-1` = no figure):

```sql
select b.name brand, min(s.day) first_day,
  string_agg(to_char(s.day,'YYYY-MM-DD')||' '||coalesce(s.farm_accounts,-1)||' '||coalesce(s.farm_accounts_active,-1)
    ||' '||coalesce(s.farm_views_gained_7d,-1), '|' order by s.day) days
from brand_stats s join brands b on b.id = s.brand_id
where s.brand_id in ('<ids from call 3>') and s.day >= current_date - 84
  and (current_date - s.day) % 7 = 0
group by 1 order by 1
```

Call 5 (accounts by the day they first pitched the brand, not the day Farmspot found them: a search batch can find
dozens of old accounts at once):

```sql
with a as (select b.name brand, a.language, a.presents_as, r.first_pitch_at
  from accounts a join brands b on b.id = a.brand_id join account_rollups r on r.account_id = a.id
  where a.status = 'tracked' and a.brand_id in ('<ids from call 3>') and r.first_pitch_at >= now() - interval '84 days')
select brand,
  count(*) filter (where first_pitch_at >= now() - interval '<days> days') started,
  count(*) filter (where first_pitch_at >= now() - interval '<2 × days> days'
                   and first_pitch_at < now() - interval '<days> days') started_before,
  string_agg(to_char(first_pitch_at, 'YYYY-MM-DD'), '|' order by first_pitch_at) starts,
  (select string_agg(language || ' ' || n, ', ') from (select language, count(*) n from a a2
     where a2.brand = a.brand and first_pitch_at >= now() - interval '28 days' group by 1 order by 2 desc) x) languages_28d,
  (select string_agg(presents_as || ' ' || n, ', ') from (select presents_as, count(*) n from a a2
     where a2.brand = a.brand and first_pitch_at >= now() - interval '28 days' group by 1 order by 2 desc) x) personas_28d
from a group by brand order by count(*) desc
```

Call 7 (concepts seen in the last `2 × days` days; `top_post` links as `https://www.farmspot.ai/videos/<top_post>`,
its cover is `https://cdn.farmspot.ai/media/covers/<tiktok_id>.jpg`):

```sql
with c as (select k.brand_id, pc.concept_id, p.id, p.posted_at, p.views, p.share_url
  from post_concepts pc join posts p on p.id = pc.post_id join concepts k on k.id = pc.concept_id
  where k.brand_id in ('<rival ids>')),
t as (select brand_id, concept_id, min(posted_at)::date first_seen, max(posted_at)::date last_seen, count(*) videos,
        count(*) filter (where posted_at >= now() - interval '<days> days') videos_in_period,
        count(*) filter (where views >= 100000) hits, max(views) best_views,
        (array_agg(id order by views desc))[1] top_post,
        substring((array_agg(share_url order by views desc))[1] from '/video/([0-9]+)') tiktok_id
      from c group by 1, 2)
select b.name brand, k.template, t.first_seen, t.last_seen, t.videos, t.videos_in_period, t.hits, t.best_views, t.top_post,
       t.tiktok_id
from t join concepts k on k.id = t.concept_id join brands b on b.id = t.brand_id
where t.last_seen >= current_date - <2 × days>
order by (t.first_seen >= current_date - <days>) desc, t.videos_in_period desc, t.best_views desc limit 15
```

### Pitfalls seen on real runs

- **Names repeat** (five brands are called "Stack"). Call 3 resolves each name to one brand: check its niche and
  `page`, and use its `id` in every sql call.
- **Rivals can sit in other niches** (a product-research tool next to store builders). Call 9 takes the niches of
  the app and of every rival.
- **Views gained lead, stored videos follow.** In a niche of small farms most weeks hold no stored video: the
  weekly panels come from call 4 (every post), the videos from call 6 (stored only), and the method says which.
- **Daily history has gaps** and starts on 2026-10-01: give `tracked_from` the first point with a figure.
- **Few stored videos in a week.** When call 6 returns fewer than 6 videos for the period, run it on `2 × days` and
  title the block with the range it covers.
- **The niche search can miss brands** that `view_brand.niche_brands` lists: add them to call 9's rows from there,
  on the figures it holds.
- **Accounts found is not accounts started.** A rival's tracked accounts can jump by dozens in a day when a Farmspot
  search finds an old farm: the count of accounts is a `line`, the starts (call 5) are what the farm added.
- **`first_pitch_at` is null** for an account that has not pitched yet: it is left out of the starts.

## Free mode (Free, Pro): 5 calls

Searches return 25 rows at most and `sql` is not used. Everything else goes in `locked`.

| # | Call | For |
|---|---|---|
| 1 | `my_account` (free) | mode, the app, the rivals |
| 2 | `view_brand {name: <app>}` | niche brands, similar brands, the app's daily history |
| 3 | call 3 above, limit 25 | the scoreboard |
| 4 | call 6 above, limit 12 | the best videos of the period (the briefs, hooks and accounts to recruit go in `locked`) |
| 5 | call 9 above | the niche brands the user does not follow |

## From the calls to blocks

- **Verdict tiles**: from call 3, the rivals' `views_gained_7d` summed (`delta` against call 4's previous week),
  call 5's `started` summed, call 6's hits counted, call 7's new concepts counted, the app's rank on
  `views_gained_7d`.
- **Scoreboard**: call 3 → `ranked` on `views_gained_7d` (`sub`: accounts active, accounts started, hits); the app
  `highlight: "self"`.
- **The weeks**: call 4 → `panels` with `shared_scale` and `complete: true`, one `line` panel per brand on `farm_views_gained_7d`
  (`agg: "last"`); call 5's `starts` → one `dots` panel per brand that started any.
- **What they posted**: call 6 → `covers`; call 7 → `formulas` (`template`, `videos`, `hits`, `top_video`), new ones
  first, their first seen date in `template`'s note.
- **How they post**: call 8 → `matrix` (rows = brands, cols = formats, `label` "hit rate · median", `n`).
- **What to shoot**: calls 12 to 14 → `breakdown` blocks: `breakdown.scenes` as beats, `product_shown_at` and
  `product_said_at` for the App row, `hook_text`, `hook_spoken`, `cta`, `description` for the brief, `transcript`
  to rewrite the steps for the user's app in `copy`.
- **Hooks to steal**: call 11 → `hooks` (`formula` = `hook_formula`, the first of `examples` as `original` with its
  `page`, `handle`, `views`).
- **Who to recruit**: call 10 → `share` on `views_gained_7d` by `language`, `presenter`, `presents_as`; `ranked` top 8.
- **Outside your list**: call 9 → `ranked` on `views_gained_30d`; `view_brand.similar_brands` from other niches →
  a second `ranked` on `views_30d`.
