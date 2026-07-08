#!/usr/bin/env python3
"""Render the audience profile pages from profiles.json.

Workflow: edit profiles.json, run `python3 build-profiles.py`, commit the
regenerated pages.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from string import Template
from urllib.parse import quote


SITE_URL = "https://russellcolevop.github.io"
EMAIL = "russellcolevop@gmail.com"
GENERATED_PAGES = ("dev", "founders", "investors", "sales")

DEFAULT_STATS = {
    "dev": [
        {"n": "137", "label": "Clients moved"},
        {"n": "737", "label": "Appointments"},
        {"n": "0", "label": "Rows lost"},
        {"n": "19&#8202;&#8594;&#8202;6", "label": "Security lints"},
    ]
}

AUDIENCES = {
    "general": {"label": "General", "color": "#2E6F4E"},
    "dev": {"label": "Engineering", "color": "#1F5A8A"},
    "sales": {"label": "Sales", "color": "#8B2E1A"},
    "founders": {"label": "Founders", "color": "#5B3A8B"},
    "investors": {"label": "Investors", "color": "#8A6D0B"},
}
AUDIENCE_LEGEND = ("general", "dev", "sales", "founders", "investors")

CHEVRON = '<svg class="card-chevron flex-shrink-0 mt-0.5 text-light-gray group-hover:text-accent" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>'
ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'


def render_stats(stats: list[dict[str, str]]) -> str:
    return "\n".join(
        Template(
            """            <div role="listitem">
              <p class="font-serif text-2xl font-semibold leading-none text-accent">$n</p>
              <p class="font-sans text-xs uppercase tracking-widest text-mid-gray mt-1.5">$label</p>
            </div>"""
        ).substitute(item)
        for item in stats
    )


def render_operate(items: list[str]) -> str:
    return "\n".join(
        Template(
            """          <li class="flex gap-4">
            <span class="mt-2.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent"></span>
            <p class="font-sans text-base md:text-lg text-near-black leading-relaxed">$item</p>
          </li>"""
        ).substitute(item=item)
        for item in items
    )


def render_background(paragraphs: list[str]) -> str:
    rendered = []
    for index, paragraph in enumerate(paragraphs):
        margin = " mb-5" if index < len(paragraphs) - 1 else ""
        rendered.append(
            f'        <p class="font-sans text-base md:text-lg text-near-black leading-relaxed{margin}" data-fade>{paragraph}</p>'
        )
    return "\n".join(rendered)


def render_work_card(card: dict[str, str], index: int) -> str:
    return Template(
        """          <article class="card-expandable rounded-xl border border-light-gray transition-all hover:shadow-sm">
            <button class="w-full text-left px-5 pt-5 pb-4 cursor-pointer group" aria-expanded="false" id="work-btn-$index" aria-controls="work-body-$index" type="button">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="font-sans font-semibold text-near-black text-base mb-1 group-hover:text-accent transition-colors">$title</h3>
                  <p class="font-sans text-sm text-mid-gray leading-relaxed">$sub</p>
                </div>
                $chevron
              </div>
            </button>
            <div id="work-body-$index" class="card-body grid" style="grid-template-rows: 0fr;" role="region" aria-labelledby="work-btn-$index">
              <div class="overflow-hidden">
                <div class="px-5 pb-5">
                  <p class="font-sans text-sm text-near-black leading-relaxed">$body</p>
                </div>
              </div>
            </div>
          </article>"""
    ).substitute(index=index, chevron=CHEVRON, **card)


def render_open_card(card: dict[str, str], index: int) -> str:
    encoded_subject = quote(f"Re: {card['subject']}")
    return Template(
        """          <article class="card-expandable rounded-xl border border-light-gray transition-all hover:shadow-sm">
            <button
              class="w-full text-left px-5 pt-5 pb-4 cursor-pointer group"
              aria-expanded="false"
              id="card-btn-$index"
              aria-controls="card-body-$index"
              type="button"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="font-sans font-semibold text-near-black text-base mb-1 group-hover:text-accent transition-colors">$title</h3>
                  <p class="font-sans text-sm text-mid-gray leading-relaxed">$sub</p>
                </div>
                $chevron
              </div>
            </button>
            <div id="card-body-$index" class="card-body grid" style="grid-template-rows: 0fr;" role="region" aria-labelledby="card-btn-$index">
              <div class="overflow-hidden">
                <div class="px-5 pb-5">
                  <p class="font-sans text-sm text-near-black leading-relaxed mb-4">
                    $body
                  </p>
                  <a
                    href="mailto:$email?subject=$encoded_subject"
                    class="card-mailto inline-flex items-center gap-1.5 text-accent text-sm font-medium hover:underline focus-visible:underline"
                    tabindex="-1"
                    aria-label="Reach out about $title"
                  >Reach out about this $arrow</a>
                </div>
              </div>
            </div>
          </article>"""
    ).substitute(
        index=index,
        email=EMAIL,
        encoded_subject=encoded_subject,
        chevron=CHEVRON,
        arrow=ARROW,
        **card,
    )


PROFILE_TEMPLATE = Template(
    """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">

  <title>$title</title>
  <meta name="description" content="$description">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="$site_url/$slug/">
  <meta property="og:title" content="$title">
  <meta property="og:description" content="$description">
  <meta property="og:image" content="$site_url/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$title">
  <meta name="twitter:description" content="$description">
  <meta name="twitter:image" content="$site_url/assets/og-image.png">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">

  <!-- Google Fonts: Inter + Source Serif 4 — async, non-render-blocking -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?$fonts_url&display=optional" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?$fonts_url&display=optional"></noscript>

  <!-- Tailwind CSS CDN -->
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'warm-bg': '#F8F5F0',
            'near-black': '#1A1A1A',
            'mid-gray': '#6B6B6B',
            'light-gray': '#D4CFC8',
            'accent': '$accent',
            'accent-hover': '$accent_hover',
          },
          fontFamily: {
            sans: ['$body_font', 'system-ui', '-apple-system', 'sans-serif'],
            serif: ['"$heading_font"', 'Georgia', '"Times New Roman"', 'serif'],
          },
          maxWidth: {
            'content': '720px',
          }
        }
      }
    }
  </script>

  <!-- JSON-LD Person Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Russell Cole",
    "jobTitle": "Builder. Operator. AI-native.",
    "email": "russellcolevop@gmail.com",
    "telephone": "+16478247898",
    "affiliation": { "@type": "Organization", "name": "Parallel Human" },
    "url": "https://russellcolevop.github.io",
    "alumniOf": [
      { "@type": "Organization", "name": "EMILI" },
      { "@type": "Organization", "name": "AgXactly Crop Insights" }
    ],
    "knowsAbout": ["agtech", "artificial intelligence", "founder operations", "CRM automation", "venture building", "SaaS development", "product operations"],
    "sameAs": ["https://www.linkedin.com/in/russellcole/"]
  }
  </script>

  <style>
    body {
      background-color: #F8F5F0;
      color: #1A1A1A;
      font-family: '$body_font', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23grain)' opacity='0.035'/%3E%3C/svg%3E");
    }
    [data-fade] { opacity: 1; }
    [data-fade].fade-hidden {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }
    [data-fade].fade-visible {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      [data-fade].fade-hidden,
      [data-fade].fade-visible {
        opacity: 1; transform: none; transition: none;
      }
    }
    :focus-visible {
      outline: 2px solid $accent;
      outline-offset: 3px;
    }
    /* Card expand */
    .card-body { transition: grid-template-rows 250ms ease; }
    .card-chevron { transition: transform 250ms ease, color 150ms ease; }
    .card--open .card-chevron { transform: rotate(180deg); }
    .card--open { border-color: $accent; }
    @media (prefers-reduced-motion: reduce) {
      .card-body { transition: none; }
      .card-chevron { transition: none; }
    }
    /* QR code responsive sizing — 200px mobile, 160px desktop */
    #qr-contact canvas, #qr-contact img { display: block; width: 200px !important; height: 200px !important; }
    @media (min-width: 640px) {
      #qr-contact canvas, #qr-contact img { width: 160px !important; height: 160px !important; }
    }
  </style>
</head>
<body class="min-h-screen">

  <!-- Availability banner -->
  <div id="agv-banner" role="banner" aria-label="Current availability notice" class="bg-near-black text-warm-bg text-sm px-4 py-3 flex items-center justify-between gap-4">
    <p id="banner-text" class="flex-1 text-center leading-relaxed">$banner</p>
    <button id="banner-dismiss" aria-label="Dismiss notice" class="flex-shrink-0 text-warm-bg opacity-60 hover:opacity-100 transition-opacity text-lg leading-none">&#215;</button>
  </div>

  <script>
    (function() {
      var banner = document.getElementById('agv-banner');
      var dismissBtn = document.getElementById('banner-dismiss');
      if (localStorage.getItem('agv-banner-dismissed') === '1') { banner.style.display = 'none'; return; }
      dismissBtn.addEventListener('click', function() {
        banner.style.display = 'none';
        localStorage.setItem('agv-banner-dismissed', '1');
      });
    })();
  </script>

  <!-- HERO -->
  <header class="px-6 pt-16 pb-16 md:pt-24 md:pb-24">
    <div class="max-w-content mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-start sm:gap-10 mb-0">
        <div
          class="mb-8 sm:mb-0 sm:flex-shrink-0 flex-shrink-0 rounded-full bg-[#E0DAD2] w-[120px] h-[120px] sm:w-[160px] sm:h-[160px]"
          style="background-image:url('../assets/russell-headshot-zoom.jpg');background-size:cover;background-position:center top;box-shadow:0 0 0 4px #F8F5F0, 0 0 0 5.5px $accent, 0 6px 24px rgba(0,0,0,0.12);"
          role="img" aria-label="Russell Cole"></div>
        <div class="flex-1">
          <h1 class="font-serif text-5xl md:text-6xl font-semibold text-near-black leading-tight tracking-tight mb-4">Russell Cole</h1>
          <p class="font-serif text-xl md:text-2xl text-near-black leading-snug mb-3">$tagline</p>
          <p class="font-sans text-base text-mid-gray leading-relaxed mb-8 max-w-lg">$intro</p>
          <a href="mailto:$email" class="inline-block bg-accent text-warm-bg font-sans font-medium text-sm px-6 py-3 rounded-sm hover:bg-accent-hover transition-colors" aria-label="Email Russell Cole at $email">$email</a>
        </div>
      </div>
    </div>
  </header>

  <main>

    <!-- FEATURED credential block -->
    <section class="px-6 pb-14 md:pb-20" aria-label="Featured credential">
      <div class="max-w-content mx-auto">
        <article class="rounded-xl border border-light-gray border-l-4 border-l-accent bg-accent/5 p-6 md:p-8" data-fade>
          <p class="font-sans text-xs font-semibold uppercase tracking-widest text-accent mb-2">$migration_kicker</p>
          <h2 class="font-serif text-xl md:text-2xl font-semibold text-near-black leading-snug mb-3">$migration_title</h2>
          <p class="font-sans text-sm text-near-black leading-relaxed mb-3">$migration_body1</p>
          <p class="font-sans text-sm text-mid-gray leading-relaxed">$migration_body2</p>
          <div class="mt-5 pt-5 border-t border-accent/20 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5" role="list" aria-label="Proof points">
$stats
          </div>
        </article>
      </div>
    </section>

    <section aria-labelledby="operate-heading" class="px-6 py-14 md:py-20 border-t border-light-gray">
      <div class="max-w-content mx-auto">
        <h2 id="operate-heading" class="font-serif text-2xl md:text-3xl font-semibold text-near-black tracking-tight mb-6" data-fade>How I operate</h2>
        <ul class="space-y-3" data-fade>
$operate_items
        </ul>
      </div>
    </section>

    <!-- PULL QUOTE -->
    <section class="px-6 py-12 md:py-16 border-t border-light-gray" aria-label="In my own words">
      <div class="max-w-content mx-auto">
        <blockquote class="border-l-4 border-accent pl-6 md:pl-8" data-fade>
          <p class="font-serif text-xl md:text-2xl italic text-near-black leading-snug">&ldquo;$quote&rdquo;</p>
        </blockquote>
      </div>
    </section>

    <!-- SELECTED WORK -->
    <section aria-labelledby="work-heading" class="px-6 py-14 md:py-20 border-t border-light-gray">
      <div class="max-w-content mx-auto">
        <h2 id="work-heading" class="font-serif text-2xl md:text-3xl font-semibold text-near-black tracking-tight mb-3" data-fade>$work_label</h2>
        <p class="font-sans text-sm text-mid-gray mb-8" data-fade>Tap any item for detail.</p>
        <div class="grid grid-cols-1 gap-3" data-fade>

$work_cards

        </div>
      </div>
    </section>

    <!-- WHAT I AM OPEN TO -->
    <section aria-labelledby="open-heading" class="px-6 py-14 md:py-20 border-t border-light-gray">
      <div class="max-w-content mx-auto">
        <h2 id="open-heading" class="font-serif text-2xl md:text-3xl font-semibold text-near-black tracking-tight mb-3" data-fade>What I am open to</h2>
        <p class="font-sans text-base text-mid-gray leading-relaxed mb-8" data-fade>$open_intro</p>
        <div class="grid grid-cols-1 gap-3" data-fade>

$open_cards

        </div>
      </div>
    </section>

    <section aria-labelledby="background-heading" class="px-6 py-14 md:py-20 border-t border-light-gray">
      <div class="max-w-content mx-auto">
        <h2 id="background-heading" class="font-serif text-2xl md:text-3xl font-semibold text-near-black tracking-tight mb-6" data-fade>Background</h2>
$background
      </div>
    </section>

<section aria-labelledby="contact-heading" class="px-6 py-8 md:py-20 border-t border-light-gray">
      <div class="max-w-content mx-auto">
        <h2 id="contact-heading" class="font-serif text-2xl md:text-3xl font-semibold text-near-black tracking-tight mb-4 sm:mb-6" data-fade>Get in touch</h2>
        <div class="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6" data-fade>

          <!-- Buttons + subtext -->
          <div class="flex-1">
            <div class="flex flex-wrap items-stretch gap-3 mb-3 sm:mb-4">
              <a
                href="mailto:$email"
                class="w-full sm:w-auto inline-flex items-center justify-center bg-accent text-warm-bg font-sans font-medium text-sm px-6 py-3 rounded-sm hover:bg-accent-hover transition-colors min-h-[44px]"
                aria-label="Email $email"
              >$email</a>
              <a
                href="../russell.vcf"
                download="russell-cole.vcf"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-accent text-accent font-sans font-medium text-sm px-5 min-h-[48px] sm:min-h-0 sm:py-3 rounded-sm hover:bg-accent hover:text-warm-bg transition-colors"
                aria-label="Save Russell Cole as a phone contact"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Save to phone
              </a>
              <a
                href="https://www.linkedin.com/in/russellcole/"
                aria-label="Russell Cole on LinkedIn"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-accent text-warm-bg font-sans font-medium text-sm px-5 min-h-[48px] sm:min-h-0 sm:py-3 rounded-sm hover:bg-accent-hover transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
            <p class="font-sans text-sm text-mid-gray">
              Best for: intro calls, potential roles, project conversations.
            </p>
          </div>

          <!-- QR code — full width on mobile, auto on sm+ -->
          <div class="w-full sm:w-auto flex flex-col items-center gap-2 flex-shrink-0 border-t border-light-gray pt-4 sm:border-0 sm:pt-0">
            <div
              id="qr-contact"
              class="border border-light-gray rounded-sm overflow-hidden bg-white p-1.5"
              aria-label="QR code, scan to save Russell Cole as a contact"
              role="img"
            ></div>
            <p class="font-sans text-xs text-mid-gray tracking-wide">Scan to save</p>
          </div>

        </div>
      </div>
    </section>

  </main>

<footer class="px-6 py-7 border-t border-light-gray">
    <div class="max-w-content mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-mid-gray font-sans">
      <p>Built and shipped in under an hour. AI-native operating in practice.</p>
      <a href="https://github.com/russellcolevop/russellcolevop.github.io" class="hover:text-accent transition-colors underline underline-offset-2">Source on GitHub</a>
    </div>
  </footer>

<!-- QR code library + generation -->
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <script>
    (function() {
      var el = document.getElementById('qr-contact');
      if (!el || typeof QRCode === 'undefined') return;
      new QRCode(el, {
        text: "BEGIN:VCARD\\r\\nVERSION:3.0\\r\\nFN:Russell Cole\\r\\nN:Cole;Russell;;;\\r\\nORG:Parallel Human\\r\\nTITLE:Builder. Operator. AI-native.\\r\\nEMAIL;TYPE=INTERNET:$email\\r\\nTEL;TYPE=CELL:+16478247898\\r\\nURL:https://russellcolevop.github.io\\r\\nEND:VCARD",
        width: 240,
        height: 240,
        colorDark: '#1A1A1A',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.L
      });
    })();
  </script>

  <!-- Scroll fade-in (respects prefers-reduced-motion) -->
  <script>
    (function() {
      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      var fadeEls = document.querySelectorAll('[data-fade]');
      fadeEls.forEach(function(el) { el.classList.add('fade-hidden'); });
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('fade-hidden');
            entry.target.classList.add('fade-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      fadeEls.forEach(function(el) { observer.observe(el); });
    })();
  </script>

  <!-- Card expand interaction -->
  <script>
    (function() {
      var cards = document.querySelectorAll('.card-expandable');
      function setCardState(card, open) {
        var btn = card.querySelector('button');
        var body = card.querySelector('.card-body');
        var mailtos = card.querySelectorAll('.card-mailto');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        body.style.gridTemplateRows = open ? '1fr' : '0fr';
        card.classList.toggle('card--open', open);
        mailtos.forEach(function(a) {
          a.setAttribute('tabindex', open ? '0' : '-1');
        });
      }
      cards.forEach(function(card) {
        var btn = card.querySelector('button');
        btn.addEventListener('click', function() {
          var isOpen = btn.getAttribute('aria-expanded') === 'true';
          cards.forEach(function(c) { setCardState(c, false); });
          if (!isOpen) setCardState(card, true);
        });
      });
    })();
  </script>


</body>
</html>
"""
)


def render_profile(profile: dict) -> str:
    migration = profile["migration"]
    stats = profile.get("stats", DEFAULT_STATS.get(profile["slug"], []))
    return PROFILE_TEMPLATE.substitute(
        site_url=SITE_URL,
        email=EMAIL,
        slug=profile["slug"],
        title=profile["title"],
        description=profile["description"],
        banner=profile["banner"],
        tagline=profile["tagline"],
        intro=profile["intro"],
        accent=profile["accent"],
        accent_hover=profile["accent_hover"],
        fonts_url=profile["fonts"]["url"],
        body_font=profile["fonts"]["body"],
        heading_font=profile["fonts"]["heading"],
        migration_kicker=migration["kicker"],
        migration_title=migration["title"],
        migration_body1=migration["body1"],
        migration_body2=migration["body2"],
        stats=render_stats(stats),
        operate_items=render_operate(profile["operate"]),
        quote=profile["quote"],
        work_label=profile["work_label"],
        work_cards="\n\n".join(
            render_work_card(card, index)
            for index, card in enumerate(profile.get("work_cards", []))
        ),
        open_intro=profile["open_intro"],
        open_cards="\n\n".join(
            render_open_card(card, index)
            for index, card in enumerate(profile.get("open_cards", []))
        ),
        background=render_background(profile["background"]),
    )


def audience_chip(audience: str) -> str:
    meta = AUDIENCES[audience]
    color = meta["color"]
    return (
        '<span class="inline-block font-sans text-xs font-medium px-2.5 py-1 '
        f'rounded-full" style="color:{color};background:{color}14;border:1px '
        f'solid {color}33">{meta["label"]}</span>'
    )


def achievement_title(item: dict[str, object]) -> str:
    title = item["title"]
    link = item.get("link")
    if not link:
        return str(title)
    return (
        f'<a href="{link}" target="_blank" rel="noopener" '
        'class="text-near-black hover:text-accent hover:underline '
        f'transition-colors">{title}</a>'
    )


def render_achievement(item: dict[str, object]) -> str:
    chips = " ".join(audience_chip(audience) for audience in item["audiences"])
    metric = item.get("metric")
    metric_html = (
        f'\n          <p class="font-sans text-xs uppercase tracking-widest text-mid-gray mt-3">{metric}</p>'
        if metric
        else ""
    )
    return Template(
        """        <article class="border-t border-light-gray pt-6" data-fade>
          <h2 class="font-serif text-xl md:text-2xl font-semibold text-near-black leading-snug mb-2">$title</h2>
          <p class="font-sans text-sm md:text-base text-mid-gray leading-relaxed mb-3">$blurb</p>
          <div class="flex flex-wrap gap-2">$chips</div>$metric_html
        </article>"""
    ).substitute(
        title=achievement_title(item),
        blurb=item["blurb"],
        chips=chips,
        metric_html=metric_html,
    )


ACHIEVEMENTS_TEMPLATE = Template(
    """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">

  <title>Russell Cole — Achievements</title>
  <meta name="description" content="The full board of Russell Cole's work and achievements, tagged by audience.">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="$site_url/achievements/">
  <meta property="og:title" content="Russell Cole — Achievements">
  <meta property="og:description" content="The full board of Russell Cole's work and achievements, tagged by audience.">
  <meta property="og:image" content="$site_url/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Russell Cole — Achievements">
  <meta name="twitter:description" content="The full board of Russell Cole's work and achievements, tagged by audience.">
  <meta name="twitter:image" content="$site_url/assets/og-image.png">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">

  <!-- Google Fonts: Inter + Source Serif 4 — async, non-render-blocking -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:wght@400;600&display=optional" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:wght@400;600&display=optional"></noscript>

  <!-- Tailwind CSS CDN -->
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'warm-bg': '#F8F5F0',
            'near-black': '#1A1A1A',
            'mid-gray': '#6B6B6B',
            'light-gray': '#D4CFC8',
            'accent': '#2E6F4E',
            'accent-hover': '#235539',
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            serif: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
          },
          maxWidth: {
            'content': '720px',
          }
        }
      }
    }
  </script>

  <!-- JSON-LD Person Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Russell Cole",
    "jobTitle": "Builder. Operator. AI-native.",
    "email": "russellcolevop@gmail.com",
    "telephone": "+16478247898",
    "affiliation": { "@type": "Organization", "name": "Parallel Human" },
    "url": "https://russellcolevop.github.io",
    "alumniOf": [
      { "@type": "Organization", "name": "EMILI" },
      { "@type": "Organization", "name": "AgXactly Crop Insights" }
    ],
    "knowsAbout": ["agtech", "artificial intelligence", "founder operations", "CRM automation", "venture building", "SaaS development", "product operations"],
    "sameAs": ["https://www.linkedin.com/in/russellcole/"]
  }
  </script>

  <style>
    body {
      background-color: #F8F5F0;
      color: #1A1A1A;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23grain)' opacity='0.035'/%3E%3C/svg%3E");
    }
    [data-fade] { opacity: 1; }
    [data-fade].fade-hidden {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }
    [data-fade].fade-visible {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      [data-fade].fade-hidden,
      [data-fade].fade-visible {
        opacity: 1; transform: none; transition: none;
      }
    }
    :focus-visible {
      outline: 2px solid #2E6F4E;
      outline-offset: 3px;
    }
    /* Card expand */
    .card-body { transition: grid-template-rows 250ms ease; }
    .card-chevron { transition: transform 250ms ease, color 150ms ease; }
    .card--open .card-chevron { transform: rotate(180deg); }
    .card--open { border-color: #2E6F4E; }
    @media (prefers-reduced-motion: reduce) {
      .card-body { transition: none; }
      .card-chevron { transition: none; }
    }
    /* QR code responsive sizing — 200px mobile, 160px desktop */
    #qr-contact canvas, #qr-contact img { display: block; width: 200px !important; height: 200px !important; }
    @media (min-width: 640px) {
      #qr-contact canvas, #qr-contact img { width: 160px !important; height: 160px !important; }
    }
  </style>
</head>
<body class="min-h-screen">
  <main class="px-6 py-16 md:py-24">
    <div class="max-w-content mx-auto">
      <h1 class="font-serif text-4xl md:text-5xl font-semibold text-near-black tracking-tight mb-2">Achievements</h1>
      <p class="font-sans text-base text-mid-gray mb-4">Everything in one place. Tags show which profile each item appears on.</p>
      <div class="flex flex-wrap gap-2 mb-10">$legend</div>
      <div class="space-y-8">
$achievements
      </div>
      <p class="font-sans text-sm text-mid-gray mt-12"><a href="../hub/" class="text-accent hover:underline">&larr; All profiles</a></p>
    </div>
  </main>
</body>
</html>
"""
)


def render_achievements(data: dict) -> str:
    return ACHIEVEMENTS_TEMPLATE.substitute(
        site_url=SITE_URL,
        legend=" ".join(audience_chip(audience) for audience in AUDIENCE_LEGEND),
        achievements="\n".join(
            render_achievement(item) for item in data["achievements"]
        ),
    )


def write_page(output_dir: Path, relative_path: str, content: str) -> None:
    path = output_dir / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render audience pages from profiles.json."
    )
    parser.add_argument(
        "--profiles",
        default="profiles.json",
        help="Path to the profiles JSON file.",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Directory where generated pages should be written.",
    )
    args = parser.parse_args()

    profiles_path = Path(args.profiles)
    output_dir = Path(args.output_dir)
    data = json.loads(profiles_path.read_text())
    profiles_by_slug = {profile["slug"]: profile for profile in data["profiles"]}

    for slug in GENERATED_PAGES:
        write_page(output_dir, f"{slug}/index.html", render_profile(profiles_by_slug[slug]))
    write_page(output_dir, "achievements/index.html", render_achievements(data))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
