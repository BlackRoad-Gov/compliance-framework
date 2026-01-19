# CLAUDE.md - AI Assistant Guide

## Repository Overview

**Project:** Compliance Framework
**Organization:** BlackRoad OS, Inc.
**Type:** Documentation & Infrastructure Standards Repository
**License:** Proprietary (NOT open source)
**Status:** 🟢 GREEN LIGHT - Production Ready

This repository establishes standardized compliance and regulatory frameworks for the BlackRoad Empire infrastructure, spanning 578 repositories across 15 specialized organizations.

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (if package.json exists) |
| `npm run build` | Build project (if build script defined) |

**Note:** This is primarily a documentation repository with no source code. GitHub Actions handle CI/CD automatically.

---

## Repository Structure

```
compliance-framework/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml                    # Cloudflare Pages deployment
│   │   ├── blackroad-codeql-analysis.yml # Security scanning
│   │   └── blackroad-auto-merge.yml      # Automated PR merging
│   └── dependabot.yml                    # Multi-ecosystem dependency updates
├── .gitignore                            # Standard ignores
├── README.md                             # Project overview
├── CONTRIBUTING.md                       # Brand guidelines & legal terms
├── TRAFFIC_LIGHT_SYSTEM.md              # Project status indicators
├── BLACKROAD_EMOJI_DICTIONARY.md        # Standardized emoji usage
├── LICENSE                               # Proprietary license
└── CLAUDE.md                            # This file
```

---

## Key Documentation Files

### README.md
Main entry point describing BlackRoad OS, Inc. as an API layer above Google, OpenAI, and Anthropic for managing AI model memory and continuity.

### CONTRIBUTING.md
**Critical for any modifications.** Contains:
- Brand color system (required and forbidden colors)
- Golden ratio spacing guidelines
- Typography standards
- Legal contribution terms

### TRAFFIC_LIGHT_SYSTEM.md
Status indicator system used across all 578 BlackRoad repositories:
- 🟢 GREEN LIGHT: Production ready
- 🟡 YELLOW LIGHT: Proceed with caution
- 🔴 RED LIGHT: Do not use in production
- 🔵 BLUE LIGHT: Archived/deprecated

### BLACKROAD_EMOJI_DICTIONARY.md
Standardized emoji conventions for documentation and commits.

---

## Brand Compliance (CRITICAL)

### Required Colors
| Color | Hex Code | Usage |
|-------|----------|-------|
| Hot Pink | `#FF1D6C` | Primary accent |
| Amber | `#F5A623` | Secondary |
| Electric Blue | `#2979FF` | Highlights |
| Violet | `#9C27B0` | Accents |
| Black | `#000000` | Background |
| White | `#FFFFFF` | Text |

### Forbidden Colors (CI will fail)
`#FF9D00`, `#FF6B00`, `#FF0066`, `#FF006B`, `#D600AA`, `#7700FF`, `#0066FF`

### Spacing (Golden Ratio)
φ = 1.618 → Scale: 8px → 13px → 21px → 34px → 55px → 89px → 144px

### Typography
- Font: SF Pro Display, -apple-system, sans-serif
- Line height: 1.618

---

## CI/CD Workflows

### 1. Deploy (deploy.yml)
**Triggers:** Push to main/master, Pull requests
**Actions:**
1. Brand compliance check (scans for forbidden colors)
2. Node.js 18 setup
3. npm install (if package.json exists)
4. npm build (if build script exists)
5. Cloudflare Pages deployment (main/master only)

### 2. CodeQL Security Analysis (blackroad-codeql-analysis.yml)
**Triggers:** Push, PRs, Weekly (Monday 4 AM UTC), Manual
**Languages:** JavaScript, Python
**Results:** Uploaded to GitHub Security tab

### 3. Auto-Merge (blackroad-auto-merge.yml)
**Triggers:** PR events, Check completion
**Behavior:** Auto-merges PRs from `blackroad-auto-fix` branch created by `github-actions[bot]`

### 4. Dependabot (dependabot.yml)
**Ecosystems:** npm, pip, Docker, GitHub Actions, Composer, Bundler, Gradle, Maven, Go, Cargo
**Schedule:** Daily (npm, pip) or Weekly (Docker, Actions)
**Commit prefix:** `🔒 [Security]`
**Note:** Major version updates are ignored for stability

---

## Commit Message Conventions

Use emoji prefixes from BLACKROAD_EMOJI_DICTIONARY.md:

| Emoji | Category | Usage |
|-------|----------|-------|
| 🔒 | Security | Security updates, fixes |
| 🎨 | Design | Brand/styling changes |
| 🚀 | Deploy | Deployment updates |
| 🐛 | Bug | Bug fixes |
| ✨ | Feature | New features |
| 📚 | Docs | Documentation |
| 🔧 | Config | Configuration changes |
| 🧪 | Test | Testing updates |
| 🌌 | BlackRoad | Proprietary enhancements |

**Format:** `<emoji> <type>: <description>`

**Examples:**
```
🔒 security: Fix XSS vulnerability
🎨 brand: Update gradient colors
📚 docs: Add traffic light system
🌌 feat: BlackRoad OS proprietary enhancement
```

---

## AI Assistant Guidelines

### DO:
- **Read existing documentation** before making changes
- **Follow brand guidelines** strictly (see CONTRIBUTING.md)
- **Use approved colors only** - CI will reject forbidden colors
- **Include appropriate emoji** in commits
- **Add copyright notice** to new files:
  ```
  © 2026 BlackRoad OS, Inc. All Rights Reserved.
  ```
- **Reference traffic light status** when discussing project health
- **Respect proprietary license** - this is NOT open source

### DON'T:
- Use forbidden colors (`#FF9D00`, `#FF6B00`, `#FF0066`, `#FF006B`, `#D600AA`, `#7700FF`, `#0066FF`)
- Create public documentation about internal implementation details
- Suggest open-source alternatives for proprietary components
- Add dependencies without security review consideration
- Skip the brand compliance check

### When Adding Documentation:
1. Follow emoji conventions from BLACKROAD_EMOJI_DICTIONARY.md
2. Include status badge at top (traffic light system)
3. Add copyright footer
4. Use golden ratio spacing if applicable
5. Maintain SF Pro Display typography references

### When Modifying Workflows:
1. Preserve brand compliance check
2. Maintain CodeQL security scanning
3. Keep Dependabot configuration intact
4. Use squash merge for cleaner history

---

## Contact Information

**Organization:** BlackRoad OS, Inc.
**CEO:** Alexa Amundson
**Email:** blackroad.systems@gmail.com
**Scale:** 30,000 AI agents + 30,000 human employees

---

## Legal Notice

**PROPRIETARY AND CONFIDENTIAL**

This software is the proprietary property of BlackRoad OS, Inc.

- Permitted: Testing, evaluation, educational purposes
- Prohibited: Commercial use, resale, redistribution without written permission
- No copying, modifying, distributing, or reverse engineering

See [LICENSE](LICENSE) for complete terms.

---

**© 2026 BlackRoad OS, Inc. All Rights Reserved.**
