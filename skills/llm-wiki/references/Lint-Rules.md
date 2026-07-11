# Lint Rules

Use this when the user asks to lint, audit, or health-check an LLM Wiki.

## Checks

1. **Broken wikilinks** — `[[link]]` points to no page.
2. **Orphan pages** — pages with no inbound wikilinks.
3. **Index completeness** — every `200-Wiki/` page appears in `index.md`.
4. **Frontmatter** — required fields are present.
5. **Tag taxonomy** — tags are defined in `200-Wiki/SCHEMA.md`.
6. **Stale content** — pages are clearly outdated.
7. **Contradictions** — `contested: true` or `contradictions:` pages.
8. **Quality signals** — `confidence: low`, or single-source pages with no confidence field.
9. **Source drift** — `100-Raw/` files with hashes have changed.
10. **Page size** — pages over ~200 lines.
11. **Log rotation** — `log.md` over 500 entries.

## Severity Order

1. broken links
2. missing frontmatter / missing index
3. source drift
4. contested / low confidence
5. stale content
6. style / size issues

## Logging

Append to `log.md`:

```markdown
## [YYYY-MM-DD] lint | N issues found
- [summary]
```
