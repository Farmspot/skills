# The calls, by mode

`<app>` is the brand name as `view_brand` resolved it. `<niche>` is `brand.niche` from `view_brand` (a key such as
`ai_store_builder`). If it is null, use `category` = `brand.category` instead of `niche` everywhere below and say
in the method that the app has no niche yet, so the comparison is its category.

Each `search` returns `range`, `definitions` and `notes`: keep the notes, the method section quotes them. A result
too big to show inline is saved to a file by some hosts: read it from there with a script, never by eye.

## Full mode (Growth): 13 calls

| # | Call | For |
|---|---|---|
| 1 | `my_account` (free) | mode, the user's app |
| 2 | `view_brand {name: <app>}` | taxonomy, figures, `daily_history`, `web_visits_by_month`, formulas, concepts, pain points, niche brands |
| 3 | `sql`: stored videos per posting week for the app and its 3 biggest rivals, 26 weeks (below) | the timeline and the rivals' panels, uncapped |
| 4 | `search` post, filters `brand = <app>`, range 180 days, order `posted_at desc`, limit 200, select `id, page, posted_at, views, handle, account_ratio, format, hook_type, hook_text, cover_url, duration_s, cta, product_shown_at` | best videos, medians, the reference median |
| 5 | `search` account, filters `brand = <app>`, order `views_gained_30d desc`, limit 200, select `handle, page, presents_as, presenter, language, region, followers, first_pitch_at, posts_per_day, posts_30d, median_views, hits, views_gained_30d, active` | concentration, account starts, language, persona |
| 6 | `search` post, filters `brand = <app>`, `labeled = true`, group_by `format`, select `n, hits, hit_rate, median_views`, range 90 days, min_n 3 | formats |
| 7 | same as 6 with group_by `hook_type` | hook types |
| 8 | `search` brand, filters `niche = <niche>`, `farms > 0`, order `views_gained_30d desc`, limit 15, select `name, page, farms, farms_active, posts_30d, views_gained_30d, outliers_30d, hits, virality_rate, median_views, web_visits` | the niche dot strip and ranks |
| 9 | `search` post, filters `niche = <niche>`, `labeled = true`, group_by `brand, format`, select `n, hits, hit_rate, median_views`, range 90 days, min_n 3, limit 100 | how competitors post |
| 10 | `search` post, filters `niche = <niche>`, `brand != <app>`, range 30 days, order `views desc`, limit 8, select `page, cover_url, views, brand, handle, hook_text, format, account_ratio` | the rivals' best videos |
| 13 | `sql`: the app's 8 biggest concepts by week (below) | when each video idea started and stopped |
| 11–12 | `view_post {id}` on the app's two best videos of the last 90 days with a breakdown, of two different formats | winners broken down |

Call 3, with the 3 biggest rivals from `view_brand.niche_brands` (by `views_gained_30d`):

```sql
select b.name as brand, date_trunc('week', p.posted_at)::date as week, count(*) as videos, sum(p.views) as views,
       count(*) filter (where p.views >= 100000) as hits, count(distinct p.account_id) as accounts_posting
from posts p join brands b on b.id = p.brand_id
where b.id in ('<app id>', '<rival 1 id>', '<rival 2 id>', '<rival 3 id>') and p.posted_at >= now() - interval '182 days'
group by 1, 2 order by 1, 2
```

Call 13 (one row per concept, its weeks packed into `weeks` as "YYYY-MM-DD videos hits|…", since one row per
concept and week runs past the sql answer limit on a big farm; the cover is the best video's,
`https://cdn.farmspot.ai/media/covers/<tiktok_id>.jpg`):

```sql
with c as (select pc.concept_id, p.id, p.posted_at, p.views, p.share_url from post_concepts pc
           join posts p on p.id = pc.post_id where p.brand_id = '<brand id>'),
top as (select concept_id, min(posted_at)::date first_seen, max(posted_at)::date last_seen, count(*) videos,
               count(*) filter (where views >= 100000) hits, (array_agg(id order by views desc))[1] top_post,
               substring((array_agg(share_url order by views desc))[1] from '/video/([0-9]+)') tiktok_id
        from c group by 1 order by count(*) desc limit 8),
w as (select c.concept_id, date_trunc('week', c.posted_at)::date week, count(*) n,
             count(*) filter (where c.views >= 100000) h from c join top using (concept_id) group by 1, 2)
select k.template, t.first_seen, t.last_seen, t.videos, t.hits, t.top_post, t.tiktok_id,
       (select string_agg(to_char(w.week, 'YYYY-MM-DD') || ' ' || w.n || ' ' || w.h, '|' order by w.week)
        from w where w.concept_id = t.concept_id) weeks
from top t join concepts k on k.id = t.concept_id order by t.first_seen
```

### Pitfalls seen on real runs

- **A name can match two brands** (Cantina the app and a bar of the same name). Check `view_brand` returned the app
  (its category and domain); if not, pass its `id`. In both sql calls filter on `brand_id`, not `b.name`.
- **Big farms outrun the 200-row caps.** Call 4 then covers only the latest weeks: say so ("the 200 latest, from
  Nov 7") on every block built from it; weekly figures always come from call 3 (sql, uncapped). Call 5 covers the top
  200 accounts by views gained: give their share of the brand's views in the curve's source.
- **Group-by searches return 25 groups by default**: on call 9, pass `limit: 100`.
- **The niche brand search can miss brands** that `view_brand.niche_brands` lists: add them from there, on the
  measures it holds.
- **`brand.hits` counts every post of the farm's accounts**, pitch or not, so it can exceed the hits among stored
  videos of the brand. Rank against rivals on `brand.hits` (same definition for all); count the brand's own hits
  from call 3, and say which is which.
- **`first_pitch_at` can start late** for accounts older than 90 days: take the earlier of it and the account's first
  stored pitch video in call 4.

## Free mode (Free, Pro): 5 calls

Searches return 25 rows at most. Everything not listed here goes in `locked`.

| # | Call | For |
|---|---|---|
| 1 | `my_account` (free) | mode, the user's app |
| 2 | `view_brand {name: <app>}` | everything about the app; the farm from its `accounts` (top 30) |
| 3 | `search` post, filters `brand = <app>`, range 180 days, order `views desc`, limit 25, select as call 4 above | timeline sample (its 25 best videos) |
| 4 | `search` post, filters `brand = <app>`, `labeled = true`, group_by `format`, select as call 6, range 90 days, min_n 3 | formats |
| 5 | `view_post {id}` on the app's best video with a breakdown | one winner broken down |

In free mode, give each section you could only partly fill a `locked` line saying what Growth adds there.

## From the calls to blocks

The page bins and draws; you map rows.

- **Timeline** (`panels`): from call 3, the app's `views`, `videos` and `hits` by week (`bars`, `sum`); from call 5,
  `first_pitch_at` as `dots` (one per account, `highlight` the ones with 4+ hits); from `daily_history`,
  `farm_accounts` and `farm_views_gained_7d` as `line`, `agg: "last"`, `tracked_from` its first day; `app_reviews` as
  `bars` with `agg: "diff"` ("US App Store ratings added", iOS apps only); `web_visits_by_month` as `step`. Call 13 → a `spans` panel
  under the hits (one row per concept). Add 3 to 5 `markers`: the first account, the best video, the peak week, a burst of new accounts.
- **Verdict tiles**: views gained in 30 days, accounts, hits in 90 days, a typical post (median views), web visits or
  ratings; `rank` from call 8, `spark` and `delta` from the same weekly figures as the panels.
- **The farm**: call 5 → `curve` on `views_gained_30d`, `ranked` top 8, `share` by language, persona, presenter.
- **What wins**: calls 6, 7 → `table` with `reference` = the median views of call 4's last 90 days; `hook_formulas`
  and `concepts` → `formulas` sorted by hits; calls 11, 12 → `breakdown` from `breakdown.scenes`; call 4's best 12 of
  the last 90 days → `covers`.
- **Against the niche**: call 8 → `dots` (views gained, hits, accounts, posts, virality rate, web visits); call 3's
  rivals → `panels` with `shared_scale` (the app first, `highlight`); call 9 → `matrix` (label "hit rate · median",
  n); call 10 → `covers`.
- **Outliers**: compare a video with its account (`account_ratio`). A brand whose brand median is tiny (a farm of many
  low-reach accounts) makes every stored video a brand outlier: then say so in the method and do not use
  `is_outlier`.
