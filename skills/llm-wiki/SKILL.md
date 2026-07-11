---
name: llm-wiki
description: Build, ingest, query, and audit a persistent, interlinked Markdown knowledge base using a portable four-layer structure. Use when users ask to create or maintain a wiki/knowledge base, ingest sources, query compiled knowledge, or lint/audit a Markdown knowledge repository.
---

# LLM Wiki

Build and maintain a persistent, compounding knowledge base as interlinked Markdown files. Compile knowledge once so that sources, cross-references, contradictions, and synthesis accumulate instead of being rediscovered for every query.

The human curates sources and directs analysis. The agent captures provenance, compiles knowledge, maintains navigation, and reports changes.

## Configuration

Set `WIKI_PATH` to the knowledge-base root. If unset, use `~/wiki`.

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

Treat `WIKI_PATH` as portable. Do not assume a particular product, user, editor, repository, or local filesystem beyond this root.

## Architecture: Four Layers

```text
WIKI_PATH/
├── 100-Raw/                         # Immutable source material
│   ├── articles/                     # Web articles and clippings
│   ├── papers/                       # PDFs and research papers
│   └── transcripts/                  # Meetings, interviews, and pasted text
├── 200-Wiki/                         # Agent-maintained   know ledge
│   ├── SCHEMA.md                     # Conventions, scope, and taxonomy
│   ├── index.md                      # Catalog of knowledge and saved outputs
│   ├── log.md                        # Append-only action log
│   ├── comparisons/                  # Side-by-side analyses
│   └── _archive/                     # Superseded compiled knowledge
├── 300-Output/                       # Reusable or shareable conclusions
│   ├── queries/                      # Filed deep dives and query results
│   └── _archive/                     # Superseded outputs
└── 999-Assets/                       # Images, PDFs, and other attachments
```

### Layer boundaries

- **100-Raw:** Preserve source evidence. Never rewrite an existing raw source. Store a new dated snapshot when a source changes.
- **200-Wiki:** Create and update entities, concepts, comparisons, schema, navigation, and logs.
- **300-Output:** File only substantial conclusions that are reusable, shareable, or costly to derive again.
- **999-Assets:** Keep all non-Markdown attachments in one place. Reference them from raw, knowledge, or output pages as needed.

## Resume an Existing Wiki

Before ingesting, querying, or linting an existing wiki:

1. Read `200-Wiki/SCHEMA.md` to learn the domain, conventions, and tag taxonomy.
2. Read `200-Wiki/index.md` to learn the catalog and existing outputs.
3. Scan the latest 20–30 entries in `200-Wiki/log.md`.
4. For a large wiki, search relevant terms across `200-Wiki/` and `300-Output/` before creating pages.

Do this orientation first to prevent duplicate pages, missed cross-references, schema violations, and repeated work.

## Initialize a Wiki

When asked to create a wiki:

1. Determine `WIKI_PATH` and the knowledge domain.
2. Create the four-layer structure above.
3. Create `200-Wiki/SCHEMA.md`, `200-Wiki/index.md`, and `200-Wiki/log.md`.
4. Seed the schema with the domain, naming conventions, frontmatter requirements, tag taxonomy, page thresholds, and update policy.
5. Add an initialization entry to the log and report the created paths.

### `200-Wiki/SCHEMA.md` requirements

Include the following sections:

# Wiki Schema

## Domain
[What this wiki covers]

## Conventions
- File names: lowercase, hyphenated, descriptive.
- Every agent-maintained page in `200-Wiki/` or `300-Output/` starts with YAML frontmatter.
- Use `[[wikilinks]]` for internal relationships; add at least two outbound links when relevant pages exist.
- Bump `updated` whenever modifying a compiled or output page.
- Add every compiled page and saved output to `200-Wiki/index.md`.
- Append every create, ingest, update, query, lint, archive, or delete action to `200-Wiki/log.md`.
- Use provenance markers for paragraphs synthesized from three or more sources.

## Frontmatter
```yaml
---
title: Page Title
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary
tags: [taxonomy-tags]
sources: [100-Raw/articles/source-name.md]
confidence: high | medium | low
contested: true
contradictions: [other-page-slug]
---
```

## Raw source frontmatter
```yaml
---
source_url: https://example.com/article
ingested: YYYY-MM-DD
sha256: <hash-of-body>
---
```

## Tag Taxonomy
[Define allowed tags before using them.]

## Page Thresholds
- Create an entity or concept page when it appears in two or more sources, or is central to one source.
- Update an existing page when a source adds material already covered.
- Do not create pages for passing mentions.
- Split pages over roughly 200 lines.

## Update Policy
[Explain how to handle newer sources, contradictions, and archival.]

Use `confidence` and `contested` for opinion-heavy, fast-moving, or weakly supported claims. Do not mark claims as high confidence without strong support.

### `200-Wiki/index.md` requirements

Maintain a sectioned catalog with one wikilink and one-line description per entry:

```markdown
# Wiki Index

> Catalog of compiled knowledge and saved outputs.
> Last updated: YYYY-MM-DD | Total pages: N

## Entities
## Concepts
## Comparisons
## Outputs
### Queries
```

List `200-Wiki` pages under their knowledge type and pages from `300-Output/queries/` under **Outputs → Queries**. When a section exceeds 50 entries, split it by alphabet or subdomain. When the index exceeds 200 entries, create `200-Wiki/_meta/topic-map.md`.

### `200-Wiki/log.md` requirements

Use an append-only format:

```markdown
# Wiki Log

> Format: `## [YYYY-MM-DD] action | subject`
> Actions: ingest, update, query, lint, create, archive, delete

## [YYYY-MM-DD] create | Wiki initialized
- Domain: [domain]
- Structure: 100-Raw, 200-Wiki, 300-Output, 999-Assets
```

Rotate a log with more than 500 entries to `log-YYYY.md` and start a new `log.md`.

## Core Operations

### Ingest a source

1. Capture the source without changing its body:
   - Web article or clipping → `100-Raw/articles/`
   - Paper or PDF text → `100-Raw/papers/`; store the original file in `999-Assets/`
   - Meeting, interview, or pasted transcript → `100-Raw/transcripts/`
   - Images, diagrams, audio, and other attachments → `999-Assets/`
2. Add raw frontmatter with `source_url` when available, `ingested`, and a SHA-256 of the source body.
3. On re-ingest, compare hashes. Skip an identical source; flag source drift and preserve the existing raw source if content differs.
4. Discuss important takeaways with the user unless the ingest is explicitly automated.
5. Search the index and existing knowledge pages for mentioned entities and concepts.
6. Create or update pages in `200-Wiki/entities/`, `200-Wiki/concepts/`, or `200-Wiki/comparisons/` only when they meet the schema threshold.
7. Add wikilinks, schema-approved tags, source references, confidence signals, and provenance markers where applicable.
8. Run the Obsidian link-integrity loop before reporting completion.
9. Update `200-Wiki/index.md` and append the exact changed files to `200-Wiki/log.md`.
10. Report every file created or updated.

### Query compiled knowledge

1. Read `200-Wiki/index.md`, then search `200-Wiki/` and `300-Output/` for relevant material.
2. Read only the pages needed to answer the question.
3. Synthesize an answer with wikilink citations to the compiled pages used.
4. When the answer is a substantial deep dive, durable synthesis, or reusable conclusion, file it in `300-Output/queries/`.
5. Run the Obsidian link-integrity loop before filing the result.
6. Add that output to the **Outputs** section of `200-Wiki/index.md` and append a query entry to `200-Wiki/log.md`.

Keep routine lookups in the conversation; do not create output pages for trivial answers.

### Lint and audit

When asked to health-check the wiki, inspect `200-Wiki/entities/`, `200-Wiki/concepts/`, `200-Wiki/comparisons/`, and `300-Output/queries/`:

1. Find orphan pages with no inbound wikilinks.
2. Find broken wikilinks.
3. Check that compiled pages and saved outputs appear in `200-Wiki/index.md`.
4. Validate required frontmatter and taxonomy tags.
5. Flag stale pages, contradictions, low-confidence claims, and single-source claims lacking confidence.
6. Recompute raw hashes in `100-Raw/` and flag source drift without rewriting raw evidence.
7. Flag pages over roughly 200 lines and logs over 500 entries.
8. Report issues by severity, then append the lint result to `200-Wiki/log.md`.

### Bulk ingest

For multiple sources, read all sources first, identify shared entities and concepts, perform one existing-page search, update pages in one pass, update the index once, and write one batch log entry.

### Archive

When a compiled page is fully superseded:

1. Move it to `200-Wiki/_archive/` while preserving its type path.
2. Remove it from the active knowledge section of the index.
3. Update inbound links to plain text plus “(archived)”.
4. Record the action in the log.

When an output is superseded, apply the same process under `300-Output/_archive/` and update its **Outputs** index entry.

Do not archive or rewrite raw evidence in `100-Raw/`.

## Obsidian Integration

The four-layer directory is compatible with Obsidian:

- Use `[[wikilinks]]` for internal navigation and Graph View.
- Use YAML frontmatter for Dataview and filtering.
- Set the attachment folder to `999-Assets/`.
- Keep source Markdown in `100-Raw/`; do not use the attachment folder as a substitute for raw evidence.

### Obsidian link-integrity loop

After organizing, creating, renaming, moving, archiving, or deleting pages for use in Obsidian, run this loop before declaring the task complete:

1. Scan `200-Wiki/` and `300-Output/` for all `[[wikilinks]]` and `![[embedded files]]` affected by the change.
2. Resolve each link using Obsidian semantics: ignore display aliases after `|` and heading/block fragments after `#`; then verify that the target Markdown page or asset exists in the four-layer structure.
3. Repair links that target a renamed or moved existing file. Update inbound links as well as the page that changed.
4. Never create an empty placeholder merely to silence a broken link. Create a missing page only when it meets the schema threshold; otherwise remove or rewrite the unsupported link.
5. Re-scan after repairs. Do not report a successful organization task while any broken link introduced or exposed by the operation remains unresolved; report remaining ambiguous links explicitly with their paths and required user decision.

## Guardrails

- Never modify an existing raw source body.
- Always orient before acting on an existing wiki.
- Always update the index and log after a material change.
- Do not create pages for passing mentions or outputs for trivial answers.
- Do not create isolated pages when relevant links already exist.
- Keep tags within the schema taxonomy.
- Ask before an ingest would update more than ten existing pages.
- Record contradictions explicitly; do not silently overwrite conflicting claims.
- Run the Obsidian link-integrity loop after every organization task that changes pages or links.
- Keep this skill portable: do not assume a particular application, repository layout beyond the four layers, or machine-specific path.

## V3 Module Boundary

This is the canonical Hermes LLM Wiki workflow. Within the K12 V3.0 product architecture, it does not implicitly read `k12-learning` Learning State or `k12-automation` data. A user must explicitly provide or authorize the minimum content to ingest. Obsidian-native dependencies remain optional and require confirmation under `references/Obsidian-Skill-Dependency.md`.
