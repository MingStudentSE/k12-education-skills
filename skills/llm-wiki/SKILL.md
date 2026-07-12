---
name: llm-wiki
description: Build, adapt, ingest, query, migrate, and audit a persistent Markdown or Obsidian knowledge base using a portable four-layer structure. Use when users ask to create or maintain a wiki, connect an existing vault without destructive reorganization, compile sources into linked knowledge, query accumulated knowledge, migrate an older education wiki, or check links, metadata, provenance, indexes, logs, and source drift.
---

# LLM Wiki

Build and maintain a persistent, compounding knowledge base as interlinked Markdown files. Compile knowledge once so that sources, cross-references, contradictions, and synthesis accumulate instead of being rediscovered for every query.

The human curates sources and directs analysis. The agent captures provenance, compiles knowledge, maintains navigation, and reports changes.

This file is the complete core workflow. The module is intentionally deep: callers choose an operation and provide a wiki root; architecture, templates, compilation rules, index/log maintenance, linting, archival, and safety behavior remain inside this implementation. The two bundled references cover only edge-specific migration and optional Obsidian adapter handling.

## Choose the operation

Choose one primary operation for the current turn. If a request mixes several operations, start with the step that makes the later steps safe.

| User intent | Primary operation | Default result |
|---|---|---|
| Create a new knowledge base | Initialize | Four layers plus local control files |
| Connect a populated Markdown/Obsidian directory | Adapt existing | Inventory and incremental mapping before writes |
| Add an article, paper, transcript, or attachment | Ingest | Immutable Raw snapshot plus warranted compiled pages |
| Ask from accumulated knowledge | Query | Answer grounded in compiled pages; durable output only when justified |
| Check health or repair maintenance drift | Lint and audit | Severity-ordered findings plus a log entry |
| Upgrade an older education wiki | Migrate | Confirmed incremental mapping; no bulk rename by default |
| Supersede compiled knowledge | Archive | Archived compiled/output page with repaired inbound links; Raw preserved |

If the user says “first inspect”, “give me a plan”, or “do not change files”, inspect only. Do not initialize, migrate, ingest, archive, or install anything in the same turn.

## Configuration

Resolve the knowledge-base root in this order:

1. A path explicitly supplied by the user.
2. `WIKI_PATH` when it is already set by the host.
3. `~/wiki` as a suggested default, not as silent authorization to write.

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

Treat `WIKI_PATH` as portable. Do not assume a particular product, user, editor, repository, or local filesystem beyond this root.

Before the first write to a new wiki, report the resolved absolute path and the files/directories that will be created, then obtain confirmation. Before migration, moving, archiving, deletion, or a bulk ingest that would update more than ten existing pages, report the affected paths and count and obtain confirmation. Read-only orientation, search, query, and audit do not require write authorization; logging an audit does.

## Architecture: Four Layers

```text
WIKI_PATH/
├── AGENTS.md                        # Local operating constraints; points to SCHEMA
├── 100-Raw/                         # Immutable source material
│   ├── articles/                     # Web articles and clippings
│   ├── papers/                       # PDFs and research papers
│   └── transcripts/                  # Meetings, interviews, and pasted text
├── 200-Wiki/                         # Agent-maintained knowledge
│   ├── SCHEMA.md                     # Conventions, scope, and taxonomy
│   ├── index.md                      # Catalog of knowledge and saved outputs
│   ├── log.md                        # Append-only action log
│   ├── entities/                     # Recurring people, organizations, works, and objects
│   ├── concepts/                     # Reusable definitions, mechanisms, and distinctions
│   ├── summaries/                    # Source-oriented syntheses worth maintaining
│   ├── methods/                      # Reusable workflows, checklists, and decision rules
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

1. Resolve the actual root and inventory its top-level structure without moving anything.
2. Read `AGENTS.md` when present. Local instructions override this module's defaults unless they conflict with the user's current request or safety requirements.
3. Read `200-Wiki/SCHEMA.md` to learn the domain, conventions, and tag taxonomy.
4. Read `200-Wiki/index.md` to learn the catalog and existing outputs.
5. Scan the latest 20–30 entries in `200-Wiki/log.md`.
6. For a large wiki, search relevant terms across `200-Wiki/` and `300-Output/` before creating pages.

When the existing repository uses the older three-layer education layout or keeps index/log under a legacy subdirectory, read `references/Migration-From-Education-Wiki.md` and propose an incremental mapping before moving anything.

Do this orientation first to prevent duplicate pages, missed cross-references, schema violations, and repeated work.

### Adapt existing without destructive reorganization

For a populated vault, report:

1. The detected Raw, compiled knowledge, output, asset, index, log, and local-instruction locations.
2. Which existing conventions can remain authoritative.
3. The smallest missing control files or directories needed for future writes.
4. Any ambiguous mappings, broken links, duplicate taxonomies, or operations that require confirmation.

Prefer indexing files in place or adding a staging directory over moving unfamiliar content. Do not bulk-rename files merely to match the default structure. Once the user accepts the mapping, record the nonstandard paths in `200-Wiki/SCHEMA.md` so later agents do not attempt a second migration.

## Initialize a Wiki

When asked to create a wiki:

1. Determine `WIKI_PATH`, the knowledge domain, and whether the target is empty.
2. If the target contains substantial material, stop using the empty-wiki template and switch to **Adapt existing**.
3. Show the resolved path and planned file list; wait for confirmation before writing.
4. Create the four-layer structure above.
5. Create `AGENTS.md`, `200-Wiki/SCHEMA.md`, `200-Wiki/index.md`, and `200-Wiki/log.md`.
6. Seed the schema with the domain, naming conventions, frontmatter requirements, tag taxonomy, page thresholds, and update policy.
7. Add one initialization entry to the log and report every created path.

### `AGENTS.md` requirements

`AGENTS.md` is the short local operating interface for agents entering the wiki. `200-Wiki/SCHEMA.md` remains the single source of domain taxonomy and page rules; do not copy a second active taxonomy into `AGENTS.md`.

Use this shape:

````markdown
# AGENTS.md

## Domain
[What this wiki covers. Detailed taxonomy lives in `200-Wiki/SCHEMA.md`.]

## Architecture

```text
100-Raw     = immutable source material
200-Wiki    = compiled knowledge network
300-Output  = reusable deliverables
999-Assets  = attachments and exported assets
```

## Operating rules
- Read `200-Wiki/SCHEMA.md`, `200-Wiki/index.md`, and recent `200-Wiki/log.md` entries before writing.
- Do not rewrite an existing file in `100-Raw/`; add a dated snapshot when a source changes.
- Follow the naming, frontmatter, tag taxonomy, page thresholds, and update policy in `200-Wiki/SCHEMA.md`.
- Add every active compiled page and saved output to `200-Wiki/index.md`.
- Append every material operation to `200-Wiki/log.md`.
- Repair affected wikilinks after renaming, moving, archiving, or deleting pages.
- Ask before moving or deleting files, or before updating more than ten existing pages.
````

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
type: entity | concept | summary | method | comparison | query | output
tags: [taxonomy-tags]
sources: [100-Raw/articles/source-name.md]
confidence: high | medium | low
contested: false
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

Calculate `sha256` from the body after frontmatter. This makes re-ingest checks independent of metadata updates.

## Tag Taxonomy
[Define allowed tags before using them.]

## Page Thresholds
- Create an entity, concept, or method page when it appears in two or more sources, is central to one source, or provides a reusable definition, mechanism, checklist, or decision rule.
- Update an existing page when a source adds material already covered.
- Do not create pages for passing mentions.
- Split pages over roughly 200 lines.

## Update Policy
[Explain how to handle newer sources, contradictions, and archival. At minimum: compare source date and quality; preserve materially conflicting claims with their dates and sources; set `contested: true` or `contradictions`; archive only fully superseded compiled knowledge.]

Use `confidence` and `contested` for opinion-heavy, fast-moving, or weakly supported claims. Do not mark claims as high confidence without strong support.

### `200-Wiki/index.md` requirements

Maintain a sectioned catalog with one wikilink and one-line description per entry:

```markdown
# Wiki Index

> Catalog of compiled knowledge and saved outputs.
> Last updated: YYYY-MM-DD | Total pages: N

## Entities
## Concepts
## Summaries
## Methods
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
> Actions: create, adapt, ingest, update, query, lint, migrate, archive, delete

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
6. Create or update pages in `200-Wiki/entities/`, `200-Wiki/concepts/`, `200-Wiki/summaries/`, `200-Wiki/methods/`, or `200-Wiki/comparisons/` only when they meet the schema threshold.
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

When asked to health-check the wiki, inspect `200-Wiki/entities/`, `200-Wiki/concepts/`, `200-Wiki/summaries/`, `200-Wiki/methods/`, `200-Wiki/comparisons/`, and `300-Output/queries/`:

1. Find orphan pages with no inbound wikilinks.
2. Find broken wikilinks.
3. Check that compiled pages and saved outputs appear in `200-Wiki/index.md`.
4. Validate required frontmatter and taxonomy tags.
5. Flag stale pages, contradictions, low-confidence claims, and single-source claims lacking confidence.
6. Recompute raw hashes in `100-Raw/` and flag source drift without rewriting raw evidence.
7. Flag pages over roughly 200 lines and logs over 500 entries.
8. Report issues in this order: broken links; missing frontmatter or index entries; source drift; contested or low-confidence claims; stale content; style and size issues.
9. If the user authorized a write, append one parseable result to `200-Wiki/log.md`:

```markdown
## [YYYY-MM-DD] lint | N issues found
- [severity summary and report path, if any]
```

If the request was read-only, return the report without silently changing the log.

### Bulk ingest

For multiple sources, read all sources first, identify shared entities, concepts, and methods, perform one existing-page search, update pages in one pass, update the index once, and write one batch log entry. Before writing, estimate how many existing pages will change; ask for confirmation when the estimate exceeds ten.

### Archive

When a compiled page is fully superseded:

1. Show the page, destination, and affected inbound links; obtain confirmation.
2. Move it to `200-Wiki/_archive/` while preserving its type path.
3. Remove it from the active knowledge section of the index.
4. Update inbound links to plain text plus “(archived)”.
5. Run the link-integrity loop and record the action in the log.

When an output is superseded, apply the same process under `300-Output/_archive/` and update its **Outputs** index entry.

Do not archive or rewrite raw evidence in `100-Raw/`.

## Obsidian Integration

The four-layer directory is compatible with Obsidian:

- Use `[[wikilinks]]` for internal navigation and Graph View.
- Use YAML frontmatter for Dataview and filtering.
- Set the attachment folder to `999-Assets/`.
- Keep source Markdown in `100-Raw/`; do not use the attachment folder as a substitute for raw evidence.

### Optional Obsidian enhancement

Only when the task needs Obsidian-native capabilities such as Bases, CLI, vault search/write, properties, or attachment embeds, read `references/Obsidian-Skill-Dependency.md`.

- Check for an existing compatible Obsidian skill first; never overwrite it.
- If it is missing, automatically attempt the exact official upstream `kepano/obsidian-skills` through the current host's Marketplace/plugin manager, then its documented `npx skills add https://github.com/kepano/obsidian-skills` fallback.
- Report the actual result. A network, timeout, DNS, or rate-limit failure is non-blocking: continue with portable Markdown/Wikilink behavior and do not claim the enhancement was installed.
- Do not install a substitute source, write into the vault, or treat installation as permission to read the vault or Learning State.

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
- Treat inspection and planning as read-only. Do not turn a request for a plan into a write operation.
- Always update the index and log after a material change; do not write a log entry for an otherwise read-only audit without authorization.
- Do not create pages for passing mentions or outputs for trivial answers.
- Do not create isolated pages when relevant links already exist.
- Keep tags within the schema taxonomy.
- Ask before an ingest would update more than ten existing pages.
- Ask before moving, archiving, deleting, or overwriting files. Never treat a requested reorganization as permission to discard unfamiliar content.
- Record contradictions explicitly; do not silently overwrite conflicting claims.
- Run the Obsidian link-integrity loop after every organization task that changes pages or links.
- Keep this skill portable: do not assume a particular application, repository layout beyond the four layers, or machine-specific path.

## V3 Module Boundary

This is the canonical Hermes LLM Wiki workflow. Within the K12 V3.0 product architecture, it does not implicitly read `k12-learning` Learning State or `k12-automation` data. A user must explicitly provide or authorize the minimum confirmed learning result to ingest; access to a wiki directory is not authorization to import a student's full history. Obsidian-native dependencies remain optional; when required, the official `kepano/obsidian-skills` enhancement may be attempted automatically under `references/Obsidian-Skill-Dependency.md`.
