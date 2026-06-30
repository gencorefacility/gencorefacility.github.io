# WordPress Site Audit Skill

Audit a WordPress site to produce a complete manifest of pages, posts, assets, forms, interactive elements, and design tokens — everything needed to port the site to a static generator.

## When to use

Before porting a WordPress site to Jekyll/GitHub Pages (or any static site generator). This audit produces the structured inventory that the port depends on.

## Inputs

- `SITE_URL`: The WordPress site URL (e.g., `https://example.com`)

## Process

### Step 1: Verify WordPress and identify the theme

```bash
# Confirm it's WordPress and find the theme
curl -sL "$SITE_URL" | grep -oP 'wp-theme-[a-z-]+|wp-child-theme-[a-z-]+'

# Check if it's a child theme — this matters for finding CSS
# If wp-child-theme-X exists, the actual stylesheet is in themes/X/style.css
# (which may 404 if all customization is via inline styles)

# Check for Elementor page builder
curl -sL "$SITE_URL" | grep -c 'elementor'
```

**Gotcha: Identify the theme from the body class, not the footer credit.** The footer may say "ThemeX" but a child theme could be in use. The child theme directory may not even have its own `style.css` — all customization happens via inline styles and the Theme Customizer.

### Step 2: Extract the sitemap — pages and navigation

```bash
# Get all pages from the REST API
curl -sL "$SITE_URL/wp-json/wp/v2/pages?per_page=50" | python3 -c "
import json, sys
pages = json.load(sys.stdin)
for p in pages:
    print(f'ID:{p[\"id\"]} | slug:{p[\"slug\"]} | parent:{p[\"parent\"]} | title:{p[\"title\"][\"rendered\"]}')
"

# Get the nav menu structure from the HTML (WP doesn't expose menus in the default API)
curl -sL "$SITE_URL" | grep -oP '<li[^>]*menu-item[^>]*>.*?</a>' | head -30
```

**Gotcha: The nav menu structure is in the page HTML, not the API.** The default WordPress REST API doesn't expose menus (requires a plugin). Extract the full nav including dropdowns from the HTML.

**CRITICAL: Extract exact URLs from navigation hrefs.** Use WebFetch or curl to read the homepage and extract every nav link's exact href. These URLs are what the Jekyll permalinks must match — never guess a URL like `/blog/` when the actual link is `/posts/`. Record the full URL map in the audit manifest so the port skill can set permalinks correctly.

### Step 3: Inventory all blog posts

```bash
# Fetch all posts (paginate if needed)
PAGE=1
while true; do
  RESULT=$(curl -sL "$SITE_URL/wp-json/wp/v2/posts?per_page=50&page=$PAGE")
  COUNT=$(echo "$RESULT" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  echo "$RESULT" | python3 -c "
import json, sys
for p in json.load(sys.stdin):
    print(f'{p[\"date\"][:10]}|{p[\"id\"]}|{p[\"slug\"]}|author:{p[\"author\"]}|media:{p[\"featured_media\"]}|{p[\"title\"][\"rendered\"]}')
"
  [ "$COUNT" -lt 50 ] && break
  PAGE=$((PAGE+1))
done

# Get author mapping
curl -sL "$SITE_URL/wp-json/wp/v2/users?per_page=20" | python3 -c "
import json, sys
for u in json.load(sys.stdin):
    print(f'ID:{u[\"id\"]} name:{u[\"name\"]}')
"
```

**Gotcha: Use the WordPress REST API as the primary structured data source.** Don't scrape HTML for post lists. The API gives you structured JSON with IDs, slugs, dates, author IDs, and rendered HTML content.

### Step 4: Inventory comments

```bash
PAGE=1
while true; do
  RESULT=$(curl -sL "$SITE_URL/wp-json/wp/v2/comments?per_page=100&page=$PAGE")
  COUNT=$(echo "$RESULT" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  echo "Page $PAGE: $COUNT comments"
  echo "$RESULT" | python3 -c "
import json, sys
from collections import defaultdict
comments = json.load(sys.stdin)
by_post = defaultdict(int)
for c in comments:
    by_post[c['post']] += 1
for pid, count in sorted(by_post.items()):
    print(f'  Post {pid}: {count} comments')
"
  [ "$COUNT" -lt 100 ] && break
  PAGE=$((PAGE+1))
done
```

**Gotcha: Comments cluster on specific posts.** Don't assume comments are evenly distributed. A few popular posts may have the vast majority of comments. This matters for your data file structure.

### Step 5: Extract design tokens

**Gotcha: Use headless Chrome screenshots to see actual colors/fonts — don't search for theme defaults.** WordPress sites customize colors via the Theme Customizer, overriding theme defaults. The actual values live in inline `<style>` blocks, not the theme's CSS file.

```bash
# Google Fonts
curl -sL "$SITE_URL" | grep -oP 'fonts\.googleapis\.com[^"'"'"']*'

# CSS custom properties (actual customized colors)
curl -sL "$SITE_URL" | grep -oP '--wp--preset--color--[^:;]+:\s*[^;]+' | sort -u

# All inline hex colors
curl -sL "$SITE_URL" | grep -oP '#[0-9a-fA-F]{3,8}' | sort -u

# Gradients
curl -sL "$SITE_URL" | grep -oP 'linear-gradient[^;)]+[);]'

# Take screenshots to visually confirm colors and layout
google-chrome --headless --disable-gpu --screenshot=homepage.png --window-size=1400,3000 "$SITE_URL"
google-chrome --headless --disable-gpu --screenshot=blogpost.png --window-size=1400,3000 "$SITE_URL/<any-post-slug>/"
```

For theme-specific custom properties (e.g., Hestia uses `--hestia-primary-color`), search for the theme name:
```bash
curl -sL "$SITE_URL" | grep -oP '--[a-z]+-primary[^}]*'
```

### Step 6: Find all images and assets

**Gotcha: Use page source HTML to find images, not the media library search.** Don't search the WP media API by guessed names. Instead, find actual image references in the page source.

```bash
# For Elementor sites, background images are in per-page CSS files, not the HTML
# Find Elementor CSS URLs from page HTML
curl -sL "$SITE_URL" | grep -oP "elementor-post-[0-9]+-css.*?href='[^']*'"
# Then fetch that CSS and extract image URLs
curl -sL "<elementor-css-url>" | grep -oP 'url\([^)]*\)'

# For non-Elementor pages, header backgrounds are in inline styles
curl -sL "$SITE_URL/<page>/" | grep -A5 'page-header' | grep -oP 'background-image.*?url\([^)]*\)'

# Collect all image URLs from the API (featured images)
curl -sL "$SITE_URL/wp-json/wp/v2/media?per_page=100" | python3 -c "
import json, sys
for m in json.load(sys.stdin):
    url = m['source_url']
    print(url)
"
```

**Gotcha: Elementor sites have per-page CSS, not just theme CSS.** Each Elementor-built page generates its own CSS file at `wp-content/uploads/elementor/css/post-{id}.css`. This contains background images, custom fonts, section-specific colors, and layout properties that aren't in the theme CSS at all.

### Step 7: Download and organize images

```bash
# Download and strip WordPress size suffixes
for url in $IMAGE_URLS; do
  fname=$(basename "$url" | sed 's/-[0-9]*x[0-9]*//')
  curl -sL "$url" -o "assets/images/$fname"
done
```

**Gotcha: Strip WordPress size suffixes when saving images.** WordPress appends `-300x200`, `-1024x768` etc. to filenames. Strip them for clean asset names.

**Gotcha: Compress large images.** WordPress often stores uncompressed PNGs for backgrounds. Convert large PNGs to JPG:
```bash
convert input.png -resize 1920x -quality 80 output.jpg
```

### Step 8: Identify interactive elements and forms

Check each page and post individually for:
- Contact forms (WPForms, Contact Form 7, Gravity Forms)
- Interactive charts/tables (JavaScript-powered)
- Embedded apps or iframes
- Shortcodes that won't translate

```bash
# Search for common form/interactive patterns across all pages
for PAGE_ID in $PAGE_IDS; do
  echo "=== Page $PAGE_ID ==="
  curl -sL "$SITE_URL/wp-json/wp/v2/pages/$PAGE_ID" | python3 -c "
import json, sys
content = json.load(sys.stdin)['content']['rendered']
# Look for forms, scripts, iframes
import re
for pattern in [r'<form', r'<script', r'<iframe', r'wpforms', r'contact-form', r'shortcode']:
    matches = re.findall(pattern, content, re.I)
    if matches:
        print(f'  {pattern}: {len(matches)} matches')
"
done
```

**Gotcha: Check each blog post for interactive elements individually.** Don't assume all embedded content is the same type. Some posts may have static images that look like they could be interactive, while others have actual JavaScript apps. Inspect each post to classify correctly.

### Step 9: Produce the audit manifest

Compile all findings into a structured summary:
1. **Sitemap** — all pages with hierarchy, URLs, and WP IDs
2. **Nav menu structure** — with dropdowns and **exact href URLs** extracted from the HTML (these become the Jekyll permalinks)
3. **Blog posts** — date, author, slug, featured image, comment count
4. **Comments** — total count, distribution by post
5. **Design tokens** — fonts, colors, gradients, spacing
6. **Image inventory** — organized by category (logos, team, blog, headers, etc.)
7. **Interactive elements** — what needs special handling or must be skipped
8. **Forms** — which can be replaced with Google Forms links, which to skip
9. **External dependencies** — Google Maps, third-party scripts, etc.

## Output

A complete audit document with all the above sections, ready to feed into the wp-to-ghpages skill for the actual port.
