# Maya's Homes V2 - Project Plan

## 1. Brand Voice & Identity Analysis
Based on a deep analysis of `https://mayashomes.com`, the brand voice is deeply personal, highly professional, and distinctly premium. The primary objective is to reflect this trust and luxury in the new V2 experience.

**Core Brand Pillars:**
- **Zero Subcontractors:** "Every trade on your project is part of Maja's in-house team." This is a huge trust signal.
- **Comprehensive Service:** "Full Remodels." No half-measures. Structural works, finishes, to final paint.
- **Hyper-Personalization:** "One Person, Start to Finish." Maja handles everything from 3D renders to handing over the keys. 
- **Multilingual Capability:** Fluent in 7 languages, ensuring clear communication with international clients relocating to Cascais.
- **The Vibe:** Approachable Luxury—Cascais coastal elegance meets *Architectural Digest* sophistication. Spaces that feel "lived-in, not staged."

## 2. "Sexy Scroll" Architecture Details
The new architecture transforms the site from a standard brochure into an interactive "Visual Experience."

- **The Scroll-Scrub Hero:** Instead of a static image, the hero features `hero-transformation.mp4`. Using JavaScript and scroll-tracking, the video playback is scrubbed back and forth based on scroll position, physically involving the user in the "Before to After" transformation.
- **"Maya's Eye" Hover Effect:** Interactive project galleries. When users hover over a finished project photo, a subtle, highly technical "blue-print" overlay transitions in. This emphasizes the engineering rigour beneath the aesthetic beauty.
- **Smart Floating Navigation:** A minimalist, glass-morphism navigation bar. To maintain immersion and maximize screen real estate, it disappears when scrolling down and reappears gracefully when scrolling up.
- **Typography & Spacing:** 
  - **Headings:** Elegant Serif (e.g., Playfair Display or Cormorant Garamond) for a premium feel.
  - **Body:** Clean Sans-Serif (e.g., Montserrat or Geist) for high legibility.
  - **Whitespace:** Extremely generous padding (8xl to 10xl). Whitespace is treated as a luxury asset to let the photography breathe.

## 3. Technology Stack
- **Core:** Semantic HTML5, Vanilla CSS3 (Custom properties, modern flex/grid).
- **Interactions:** Vanilla JavaScript combined with **GSAP (GreenSock)** & **ScrollTrigger** for performant scroll-scrubbing and smooth micro-interactions. No heavy frameworks are necessary, keeping the site lightning fast and SEO-friendly.

## 4. Scaffolded Directory Structure
The workspace has been initialized with the following structure:
```text
/Users/lukasbot/Desktop/Mayas-Homes-V2/
├── PROJECT_PLAN.md        # This document
├── index.html             # Main entry point
├── css/
│   ├── index.css          # Main stylesheet and design system tokens
│   └── animations.css     # CSS-based micro-animations and transitions
├── js/
│   ├── main.js            # Entry script
│   ├── scroll-scrub.js    # Logic for the hero video scrub effect
│   └── nav.js             # Floating glass-morphism nav logic
└── assets/
    ├── videos/            # hero-transformation.mp4 goes here
    ├── images/            # Project and team photos
    └── fonts/             # Custom font files
```

## 5. Next Steps
1. Insert the `hero-transformation.mp4` into the `assets/videos` folder.
2. Initialize the `index.html` structure with the SEO best practices and the semantic layout.
3. Build the design system in `css/index.css`.
4. Implement the Scroll-Scrub video logic using GSAP.
