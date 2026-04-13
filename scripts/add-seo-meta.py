#!/usr/bin/env python3
"""Add OpenGraph + Twitter Card + canonical meta tags to every HTML page.

Reuses <title> and <meta name="description"> already present in each file.
og:image defaults to /og-default.png at site root (adjust if you have page-
specific images later). Skips pages that already have an og:title tag.
"""
import re
from pathlib import Path

SITE = "https://porphyre.studio"
DEFAULT_IMAGE = f"{SITE}/og-default.png"

def rel_url(path: Path, root: Path) -> str:
    rel = path.relative_to(root).as_posix()
    # index.html → "", others keep the .html
    if rel == "index.html":
        return f"{SITE}/"
    if rel.endswith("/index.html"):
        return f"{SITE}/{rel[:-10]}"
    # strip ".html" for commander/* and blog/* to match Vercel clean URLs
    if rel.endswith(".html"):
        return f"{SITE}/{rel[:-5]}"
    return f"{SITE}/{rel}"

def extract(text, pattern):
    m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    if not m:
        return None
    return re.sub(r"\s+", " ", m.group(1).strip())

def build_meta_block(title: str, description: str, url: str) -> str:
    esc = lambda s: (s or "").replace('"', "&quot;")
    return f'''    <link rel="canonical" href="{url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Porphyre Studio" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{esc(title)}" />
    <meta property="og:description" content="{esc(description)}" />
    <meta property="og:image" content="{DEFAULT_IMAGE}" />
    <meta property="og:locale" content="fr_FR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{esc(title)}" />
    <meta name="twitter:description" content="{esc(description)}" />
    <meta name="twitter:image" content="{DEFAULT_IMAGE}" />
'''

def process(path: Path, root: Path) -> bool:
    text = path.read_text(encoding="utf-8")

    # already has og:title? skip
    if re.search(r'property="og:title"', text):
        return False

    title = extract(text, r"<title[^>]*>([^<]*)</title>")
    desc = extract(text, r'<meta\s+name="description"\s+content="([^"]*)"')
    if not title:
        print(f"  SKIP {path.relative_to(root)} — no <title>")
        return False
    if not desc:
        # derive from title
        desc = title

    url = rel_url(path, root)
    block = build_meta_block(title, desc, url)

    # Insert right after <meta name="description">, else after <title>
    if desc_match := re.search(r'<meta\s+name="description"[^>]*>\s*\n', text):
        new = text[:desc_match.end()] + block + text[desc_match.end():]
    else:
        title_match = re.search(r"</title>\s*\n", text)
        if not title_match:
            print(f"  SKIP {path.relative_to(root)} — cannot find insertion point")
            return False
        new = text[:title_match.end()] + block + text[title_match.end():]

    path.write_text(new, encoding="utf-8")
    return True

def main():
    root = Path(__file__).resolve().parent.parent
    files = sorted(
        list(root.glob("*.html"))
        + list(root.glob("commander/*.html"))
        + list(root.glob("blog/*.html"))
    )
    done = 0
    for f in files:
        if process(f, root):
            print(f"  ✓ {f.relative_to(root)}")
            done += 1
    print(f"\n{done}/{len(files)} pages updated")

if __name__ == "__main__":
    main()
