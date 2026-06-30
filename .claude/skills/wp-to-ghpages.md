# WordPress to GitHub Pages Port Skill

Port a WordPress site to Jekyll on GitHub Pages, preserving all content, comments, images, and visual design.

## Critical: Work one page at a time

Do NOT attempt a bulk port of all pages at once. Port one page at a time using this loop:

1. Screenshot the original WordPress page (headless Chrome)
2. Build/fix the Jekyll version of that page
3. Rebuild the site and screenshot the new version
4. Compare the two screenshots side-by-side
5. Fix discrepancies and repeat steps 3-4 until the page matches
6. Move to the next page

Keep the original screenshot on hand throughout — always compare against the real site, not your memory of it.

## Critical: Preserve all original URLs

Every page permalink must match the original WordPress URL path exactly. Extract URLs from the site's navigation links (never guess URLs). If the WordPress blog listing is at `/posts/`, the Jekyll page must use `permalink: /posts/`. If ordering is at `/home-page/ordering/`, match that too (or decide explicitly to change it — don't accidentally drift).

## Prerequisites

- A completed WordPress audit (use the `wp-audit` skill first)
- The audit manifest with: sitemap, post list, comment inventory, design tokens, image inventory, interactive element list
- A GitHub repository for the destination (GitHub Pages builds Jekyll from the main branch automatically — no Actions needed)

## Inputs

- `SITE_URL`: The WordPress site URL
- `REPO`: The GitHub repository (e.g., `org/org.github.io`)
- `AUDIT`: The completed audit manifest

## Process

### Step 1: Initialize the Jekyll project

```bash
mkdir -p _layouts _includes _posts _data/comments _sass assets/{css,js,images} pages

# Gemfile — use github-pages gem for compatibility
cat > Gemfile << 'EOF'
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "webrick"
EOF

# .gitignore
cat > .gitignore << 'EOF'
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
Gemfile.lock
vendor/
.bundle/
EOF
```

### Step 2: Create `_config.yml`

**IMPORTANT: Do NOT include `collections_dir` in the config.** Setting `collections_dir: .` (or any value) breaks post discovery with the github-pages gem — Jekyll will silently find zero posts and render empty blog sections with no error message. Just omit the key entirely; the default behavior is correct.

```yaml
title: "Site Title"
description: "Site description"
url: "https://org.github.io"
baseurl: ""
permalink: /:categories/:title/
markdown: kramdown
highlighter: rouge
kramdown:
  input: GFM
  syntax_highlighter: rouge
sass:
  style: compressed
  sass_dir: _sass
exclude:
  - Gemfile
  - Gemfile.lock
  - vendor
  - README.md
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"
      comments: true
  - scope:
      path: "pages"
      type: "pages"
    values:
      layout: "page"
```

### Step 3: Build the navigation data

Create `_data/nav.yml` from the audit's nav menu structure:

```yaml
- title: Home
  url: /
  children:
    - title: Sub Page
      url: /sub-page/
- title: Section
  url: /section/
  children:
    - title: Child Page
      url: /section/child/
```

### Step 4: Build the Sass/CSS system

Create partials from the audit's design tokens:

- `_sass/_variables.scss` — colors, fonts, spacing, shadows from the audit
- `_sass/_base.scss` — reset, typography, links, tables, code blocks
- `_sass/_nav.scss` — sticky header, dropdown menus, mobile toggle
- `_sass/_page-header.scss` — hero/page header with background image + overlay
- `_sass/_homepage.scss` — homepage-specific sections (icon cards, blog preview, location, banners)
- `_sass/_content.scss` — content cards, grids, tabs, carousels, team cards, equipment items
- `_sass/_blog.scss` — blog listing, post preview cards, single post styles
- `_sass/_comments.scss` — comment thread styling
- `_sass/_footer.scss` — footer layout

Entry point `assets/css/style.scss` (must have empty front matter for Jekyll to process):
```scss
---
---
@import url('https://fonts.googleapis.com/css2?family=...');
@import "variables";
@import "base";
// ... etc
```

**Key design decisions:**
- Use the exact colors, fonts, and gradients from the audit's design tokens
- Keep the WordPress site's visual structure (sticky nav, page header, content cards with shadow)
- Page backgrounds should match the original (usually light gray, not white)
- Content areas should be white cards with subtle shadows, floating above the background

**CRITICAL: Extract overlay/background values from the site's actual CSS — never guess.**
Many WordPress themes use dark overlays (`rgba(0,0,0,0.3)`) over hero/banner images, not colored gradients. If you invent a pink/purple gradient when the site actually uses a subtle dark overlay, every page header will look wrong. Fetch the site's per-page CSS files (look for `<link>` tags with CSS URLs containing `post-` or `page-` IDs) and extract the exact `background-color`, `opacity`, and `background-image` values for each section.

**CRITICAL: Include any icon libraries the original site uses.**
WordPress sites commonly use Font Awesome, Material Icons, or similar icon libraries. Check the original page source for icon `<link>` tags (e.g., Font Awesome CDN) and include the same library in your `default.html` `<head>`. Don't substitute emoji Unicode characters for proper icons — they look completely different.

### Step 5: Create layouts

Four layouts cover most WordPress sites:

**`_layouts/default.html`** — HTML shell with head, nav, main, footer, scripts. Include any icon libraries (Font Awesome, etc.) and Google Fonts the original site uses in the `<head>`.

**`_layouts/home.html`** — extends default, includes page-header, renders content directly (no card wrapper — homepage has custom sections).

**`_layouts/page.html`** — extends default, includes page-header, wraps content in a `.content-card` div.

**`_layouts/post.html`** — extends default, includes page-header, wraps content in article with post header (title, date, author), post body, and comment include.

### Step 6: Create includes

**`_includes/header.html`** — nav bar built from `site.data.nav`, mobile toggle button.

**`_includes/footer.html`** — footer links, credit line.

**`_includes/page-header.html`** — background image + gradient overlay, page title, optional subtitle. Reads `page.header_image` for the background. **CRITICAL: Do NOT put `{{ content }}` in this include.** The include renders inside the layout, which already renders `{{ content }}`. If the include also renders `{{ content }}`, every page's body will appear twice — once inside the header overlay (broken) and once in the main body. The page-header include should ONLY render `page.title`, `page.subtitle`, and the background image.

**`_includes/comments.html`** — renders comments from `site.data.comments[page.slug]`. Handles nested replies.

### Step 7: Create JavaScript

Minimal JS for:
- Mobile nav toggle (add/remove `.open` class)
- Tab switching (if any pages use tabs)
- Image carousel (if any pages have carousels)

### Step 8: Download and organize images

From the audit's image inventory:

```bash
# Organize into logical subdirectories
assets/images/
  logos/          # site logos, partner logos
  team/           # team headshots
  equipment/      # equipment photos
  platforms/      # product/platform images
  blog/           # blog post images (featured + inline)
  header-*.jpg    # page header backgrounds
  hero-bg.jpg     # homepage hero background
```

**Gotcha: Compress large background images.** WordPress often stores massive PNGs. Convert to JPG at 1920px width, quality 80:
```bash
convert large-bg.png -resize 1920x -quality 80 hero-bg.jpg
```

**Gotcha: Strip WordPress size suffixes** (`-300x200`, `-1024x768`) when saving:
```bash
fname=$(basename "$url" | sed 's/-[0-9]*x[0-9]*//')
```

### Step 9: Port pages

For each page in the audit's sitemap:

1. Fetch content from WP REST API: `curl -sL "$SITE_URL/wp-json/wp/v2/pages/<ID>"`
2. Create a Jekyll page file (`.html` or `.md`) with front matter:
   ```yaml
   ---
   layout: page
   title: "Page Title"
   permalink: /page-slug/
   header_image: /assets/images/header-section.jpg
   ---
   ```
3. Clean the `content.rendered` HTML:
   - Strip WordPress/Elementor wrapper divs and classes (`wp-block-*`, `elementor-*`)
   - Replace `wp-content/uploads/` image URLs with local `/assets/images/` paths
   - Convert Elementor widgets to semantic HTML (tabs → `.tab-group`, accordions → `<details>/<summary>`, etc.)
   - Keep external links as-is
4. Map page header backgrounds from the audit's design tokens

**Gotcha: Elementor pages need special handling.** Elementor generates deeply nested divs with data attributes. Strip all of it and keep only the semantic content (headings, paragraphs, images, lists, links).

### Step 10: Port blog posts

For each post in the audit's post list:

1. Fetch from API: `curl -sL "$SITE_URL/wp-json/wp/v2/posts/<ID>"`
2. Create `_posts/YYYY-MM-DD-slug.md` with front matter:
   ```yaml
   ---
   layout: post
   title: "Post Title"
   date: YYYY-MM-DD
   author: "Author Name"
   featured_image: /assets/images/blog/image.jpg
   header_image: /assets/images/header-blog.jpg
   comments: true
   ---
   ```
3. Convert `content.rendered` HTML to Markdown:
   - Headings, paragraphs, lists → Markdown
   - Code blocks → fenced code blocks with language tags
   - Images → `![alt](/assets/images/blog/filename.jpg)`
   - Tables → Markdown tables
   - Strip WordPress figure/figcaption wrappers
4. Replace WordPress image URLs with local paths (match filenames after stripping size suffixes)

**Gotcha: Check each post for interactive elements.** Don't assume all embedded content is the same type. Some posts may have static images that look interactive, while others have actual JavaScript apps. Inspect each post and decide: port static content, skip interactive apps (note what was skipped), or link to the original.

### Step 11: Export and preserve comments

Fetch all comments from the API and create YAML data files:

```bash
# Fetch all comment pages
PAGE=1
ALL_COMMENTS="[]"
while true; do
  BATCH=$(curl -sL "$SITE_URL/wp-json/wp/v2/comments?per_page=100&page=$PAGE")
  COUNT=$(echo "$BATCH" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  ALL_COMMENTS=$(python3 -c "
import json
a = json.loads('$ALL_COMMENTS')
b = json.loads('''$BATCH''')
print(json.dumps(a + b))
")
  [ "$COUNT" -lt 100 ] && break
  PAGE=$((PAGE+1))
done
```

Create `_data/comments/<post-slug>.yml` for each post that has comments:

```yaml
- author: "Commenter Name"
  date: "2024-01-15"
  content: |
    <p>The comment HTML content</p>
  replies:
    - author: "Reply Author"
      date: "2024-01-16"
      content: |
        <p>Reply content</p>
```

**Key decisions:**
- Use the `parent` field to nest replies under parent comments
- Sort comments chronologically (oldest first)
- Use `content.rendered` (HTML) for comment content
- Do NOT use Disqus or any third-party service — static YAML files rendered by the post template
- The comment include reads from `site.data.comments[page.slug]` — slugs must match post filenames

### Step 12: Create the blog listing page

**First, find the original blog listing URL.** Fetch the homepage HTML and extract the Blog nav link href — do NOT guess `/blog/` or `/posts/`. Use whatever URL the original site uses.

Create `blog.html` in the root with `permalink` matching the original URL:
```html
---
layout: default
title: Blog
permalink: /posts/   # <-- MUST match the original WP blog listing URL
header_image: /assets/images/header-blog.jpg
---
{% include page-header.html %}
<div class="blog-list">
  {% for post in site.posts %}
  <div class="post-preview">
    {% if post.featured_image %}
    <div class="post-thumb" style="background-image: url('{{ post.featured_image }}')"></div>
    {% endif %}
    <div class="post-preview-body">
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}{% if post.author %} · by {{ post.author }}{% endif %}</p>
      <p>{{ post.excerpt | strip_html | truncate: 200 }}</p>
    </div>
  </div>
  {% endfor %}
</div>
```

### Step 13: Test locally — page-by-page screenshot comparison

This is the most important step. Do not skip or rush it. Build the site, serve it, and compare every page against the original using headless Chrome screenshots.

```bash
# Build and serve (use Docker if Ruby/Jekyll not installed locally)
docker run --rm -d --network=host -v "$PWD:/srv/jekyll" \
  --name jekyll-serve jekyll/jekyll:4 \
  bash -c "bundle install --quiet && bundle exec jekyll serve --host 0.0.0.0 --port 4000"
```

**Verification loop for EACH page:**

1. Screenshot the original WordPress page:
   ```bash
   google-chrome --headless --disable-gpu --no-sandbox \
     --screenshot="reference-screenshots/original-<page>.png" \
     --window-size=1400,3000 "https://original-site.com/<page>/"
   ```

2. Screenshot the Jekyll version:
   ```bash
   google-chrome --headless --disable-gpu --no-sandbox \
     --screenshot="reference-screenshots/current-<page>.png" \
     --window-size=1400,3000 "http://localhost:4000/<page>/"
   ```

3. View both screenshots and compare. Check for:
   - **Content duplication** — anything appearing twice means a layout/include bug
   - **Missing content** — empty sections (especially blog post lists) mean posts aren't being found
   - **Wrong content** — content from another page appearing means layout contamination
   - **Missing images** — broken image paths
   - **Layout differences** — wrong spacing, missing sections, wrong order

4. Fix issues, rebuild, re-screenshot, and compare again. Repeat until the page matches.

**Common traps that cause silent failures:**
- `collections_dir` in `_config.yml` → zero posts found, no error
- `{{ content }}` in `page-header.html` include → content renders twice on every page
- Blog listing permalink doesn't match nav link → 404 on blog page
- Missing `featured_image` in post front matter → empty blog cards on homepage

### Step 14: Deploy

```bash
# GitHub Pages builds Jekyll automatically from main branch — just push
git add -A
git commit -m "Initial Jekyll port from WordPress"
git push origin main
```

No GitHub Actions configuration needed. GitHub Pages detects the Jekyll project and builds it.

## Common issues

1. **`collections_dir` breaks post discovery** — Do NOT set `collections_dir: .` (or any value) in `_config.yml`. With the github-pages gem, this silently prevents Jekyll from finding `_posts/`. You'll get zero posts with no error message — blog sections render empty, homepage blog previews show nothing. Just omit the key entirely.
2. **`{{ content }}` in page-header include causes duplication** — If `_includes/page-header.html` contains `{{ content }}`, every page's body renders twice: once inside the header overlay (mangled, overlapping the hero image) and once in the normal position. The include should only render title and subtitle — never `{{ content }}`.
3. **Permalink mismatches break navigation** — Extract every URL from the original site's nav links. Set each Jekyll page's `permalink:` to match exactly. Don't guess — fetch the page and read the hrefs. If the WP blog is at `/posts/`, use `permalink: /posts/`, not `/blog/`.
4. **Wrong overlay colors on page headers** — Don't guess overlay colors. Most WordPress sites use a dark semi-transparent overlay on hero/banner images, not a colored gradient. Extract the exact overlay `background-color` and `opacity` values from the site's per-page CSS files. A pink gradient on a site that uses a dark overlay makes every page look completely wrong.
5. **Missing full-width background sections** — WordPress pages often have full-width sections with background images, overlays, and shape dividers between them. If you don't fetch the per-page CSS to discover these background images, you'll miss entire sections. Check the CSS for every `background-image: url(...)` on each page you're porting.
6. **Wrong images on blog posts** — If the site uses featured images or inline images in posts, verify each post's images individually against the original. Don't reuse the same image across posts or guess which image belongs to which post.
7. **Missing icon libraries** — WordPress sites commonly use Font Awesome or similar icon libraries. If you substitute emoji characters for proper icons, the visual match will be way off. Check the original `<head>` for icon library `<link>` tags and include them.
8. **GitHub Pages gem version conflicts** — `github-pages` pins specific gem versions. Don't add gems that conflict.
9. **Sass deprecation warnings** — GitHub Pages uses an older Sass version. Avoid newer Sass features (`@use`, `@forward`). Stick with `@import`.
10. **Large files** — GitHub has a 100MB file limit. Compress images before committing.
11. **Missing images** — After porting, grep for any remaining `wp-content/uploads` references and replace them.
12. **Comment slugs** — The comment YAML filename must match the post's `page.slug` (derived from the filename by default). If you set a custom `slug` in front matter, use `comment_slug` to override.
