# UI/UX Pro Max — install notes

Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, v2.5.0)

Installed manually into `.claude/skills/ui-ux-pro-max/` so Claude Code auto-discovers it.
Bundled: SKILL.md + scripts/ (Python stdlib only) + data/ (30 CSVs) + templates/.
Command paths in SKILL.md were rewritten to `.claude/skills/ui-ux-pro-max/...`
so they run as-written from the project root.

Quick test:
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py "rental dashboard admin" --design-system -p "RentFlow"
