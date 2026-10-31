# Dashboard & User-Facing Visualization Standard

**Version:** 1.0  
**Status:** Mandatory for all Agents (Antigravity, Claude, and Subagents)  
**Reference:** Impeccable Design Standards & Anthropic Editorial UI

---

## 1. The Core Law: Never Show Raw HTML Code to Users

When a user asks for a dashboard, status report, or user-facing visualization:
* **Never** expect the user to read or navigate raw HTML markup in a code editor.
* **Always deliver dual formats:**
  1. A structured Markdown document (`.md`) for quick text reference and agent reading.
  2. A polished, standalone interactive HTML document (`.html`).
* **Always auto-open the HTML document:** Immediately execute `open <path_to_file.html>` in the background so macOS launches it in the user's default browser (Chrome / Safari) for instant viewing.
* **Always create an Artifact:** In Antigravity, record a user-facing artifact in the conversation artifact directory (`<appDataDir>/brain/<conversation-id>`) with `ArtifactMetadata: { UserFacing: true }`.

---

## 2. Design System: Impeccable UI & Anthropic Warm Editorial

To prevent generic "AI Slop" (bland Bootstrap, floating neon radial glows, unrequested purple/indigo gradients):

### Color Tokens & Discipline
* **Light Theme (Anthropic Editorial):**
  * Canvas: `#faf9f5` (warm unbleached ivory paper)
  * Surface/Cards: `#ffffff` with `border: 1px solid #e6e4dc`
  * Text Primary: `#141413` (deep warm slate charcoal; never pure `#000000`)
  * Text Secondary: `#5e5d59` / Muted: `#8b8982`
  * Accent: `#d97757` (Clay / Terracotta Orange)
  * Success / Active: `#3b7a57` / `#edf5f0`
* **Dark Theme (Linear Swiss / Impeccable):**
  * Canvas: `#09090b` (deep neutral zinc)
  * Surface/Cards: `#121215` with `border: 1px solid #27272a`
  * Text Primary: `#fafafa`
  * Accent: Acid Lime (`#d4f756`) or Crisp Royal Blue (`#2563eb`)

### Typography
* **Headings:** High-contrast serif (Newsreader, Charter, Georgia) or tight geometric sans (`tracking-tight`).
* **Data / Metrics:** Monospace (`ui-monospace`, `JetBrains Mono`, `SFMono-Regular`) for all numerical counts, memory/disk metrics, IDs, timestamps, and tabular values.
* **Eyebrow:** Small uppercase tracking labels (`text-xs uppercase tracking-widest text-[#d97757]`) positioned directly above major headings.

### Interactive Requirements
* **Copy Buttons:** Every bash command or code snippet must have an integrated 1-click copy button with instant `"Copied ✓"` visual feedback.
* **Tabs & State:** Group workflows logically (e.g. *Safe Migration* vs *Reactivation*) with instant tab switching.
* **Live Calculations & Checklists:** Checkboxes must update visual progress bars or metric counters in real time.

---

## 3. Reusable Master Prompt for Impeccable Dashboards

Use this prompt pattern when generating dashboards:

```text
Create a production-grade, highly polished interactive dashboard as a standalone single-file HTML application.

### Aesthetic & Design Guidelines
- Aesthetic Preset: Anthropic Warm Editorial (warm ivory #faf9f5 canvas, deep charcoal #141413 text, terracotta #d97757 accent, crisp 1px borders #e6e4dc).
- Strict Token Discipline: Zero unrequested purple gradients, zero blurry neon glows, zero pill containers for cards.
- Layout: Asymmetric bento grid for top KPI metrics, followed by dense structured cards with clear hierarchy.
- Typography: Serif headings (Newsreader/Charter/Georgia), sans-serif body, JetBrains Mono/system-mono for numbers, paths, and commands.

### Functional Requirements
- 1-click copy button with tooltip/copied feedback on every command block.
- Interactive tab switching between major modes/phases.
- Checklists connected to a live progress bar tracking task completion.
- Fully self-contained (vanilla JS and clean scoped CSS; no broken external CDN dependencies).

After writing the file, immediately run:
open <absolute_path_to_html_file>
so the user sees the rendered visual in their browser immediately.
```
