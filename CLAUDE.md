# Hierarchy Selector — Mendix pluggable widget

Handoff notes. Read this before changing anything in `src/`.

## What this widget is

A generic two-level selector for Mendix web pages: a drop-down of parent objects
on top, and a checkbox group of the matching child objects underneath, with
select all / clear all.

The originating requirement was Country → City, but nothing in the widget knows
what the data means. The same build must keep working for Continent → Country,
City → Area, Category → Subcategory, and so on. **Do not introduce
domain-specific naming, captions, or defaults.** Parent and child are the only
vocabulary.

## Current state

Three files exist and are believed correct but have not been compiled or run in
Studio Pro yet:

- `src/HierarchySelector.xml` — widget definition
- `src/HierarchySelector.tsx` — React component
- `src/ui/HierarchySelector.scss` — styles

There is no scaffold around them yet. First job is likely
`npx @mendix/generator-widget`, then dropping these in and running
`npm run build`. Expect the first pass to surface type mismatches against the
generated `typings/HierarchySelectorProps.d.ts` — that file is the source of
truth for prop shapes, not the hand-written component.

Target: Studio Pro 11. The APIs used also exist in Mendix 10.

## The core technical decision

Getting the child list used to require a microflow data source parameterised by
the parent, with a round trip and model plumbing on every change. This widget
avoids that. It takes **two independent list data sources** and re-filters the
child one from the client:

```ts
childSource.setFilter(equals(association(childParent.id), literal(selectedParent)));
```

- `childParent` is an `association` property with `dataSource="childSource"`,
  which the client receives as a `ListReferenceValue`.
- `selectedParent` is an `ObjectItem` taken straight from `parentSource.items`.
- Filter builders come from `mendix/filters/builders`.
- Always guard on `childParent.filterable` before calling `setFilter`.

For Database and XPath data sources this filter is pushed to the back end. For
microflow and nanoflow sources the filtering happens in the client, meaning the
microflow still returns every row — that is a real limitation, not a bug to fix
in the widget. If a consumer needs a microflow source with server-side
filtering, they should parameterise the microflow instead.

## Property contract

| Key | Type | Notes |
|---|---|---|
| `parentSource` | datasource, isList | e.g. Country |
| `parentCaption` | textTemplate on `parentSource` | drop-down option text |
| `childSource` | datasource, isList | e.g. City — Database or XPath preferred |
| `childCaption` | textTemplate on `childSource` | checkbox label |
| `childParent` | association (Reference) on `childSource` | the filter target |
| `childLimit` | integer, default 500 | passed to `setLimit` |
| `selection` | association (ReferenceSet), `selectableObjects="childSource"` | the output |
| `clearOnParentChange` | boolean, default true | |
| `onChange` | action | fires after `setValue` |

Appearance props (`parentLabel`, `parentPlaceholder`, `emptyMessage`,
`showSearch`, `showSelectAll`, `showCount`, `minColumnWidth`) are all optional
and must stay optional. `needsEntityContext="true"` because `selection` writes
to a surrounding context object.

## Layout rules that are deliberate

- **Container queries, not media queries.** A Mendix widget can sit in a
  full-width row or a narrow layout-grid column, and the viewport tells you
  nothing about which. `container-type: inline-size` on the root plus
  `@container (max-width: 420px)` is what makes it collapse correctly. Do not
  replace these with `@media`.
- **Atlas classes on controls.** The `select` and buttons use `form-control` and
  `btn btn-default btn-sm` so they inherit the app theme. Don't hand-style them.
- **Themeable custom properties.** Colours and spacing come from `--hs-*` vars
  declared on the root, each falling back to an Atlas variable. Consumers
  override these; the rules below them should stay untouched.
- Keyboard focus is visible via `:focus-within` on each option, and the
  transition is wrapped in `prefers-reduced-motion`. Keep both.

## Known gaps and open questions

1. **Paging vs. select all.** `items` only ever holds the currently loaded page.
   `setLimit(childLimit)` raises the ceiling, and the footer warns when
   `hasMoreItems` is true, but "select all" still means "all loaded". If real
   parents have thousands of children this needs rethinking — probably a
   server-side "select all matching" rather than iterating items.
2. **Unfiltered initial fetch.** Before a parent is chosen the filter is cleared
   (`setFilter(undefined)`), so the child source fetches unconstrained. Rendering
   is gated so the user never sees it, but the query still runs. Consider
   `setLimit(0)` or a never-true filter in that state.
3. **Search is client-side only**, over already-loaded items. Fine for a few
   hundred; if it needs to scale, push it into the filter with `contains` on the
   caption attribute — which would require adding an `attribute` property
   alongside the `textTemplate`, since text templates aren't filterable.
4. Not yet tested: `Editability` / read-only behaviour, offline capability
   (declared `offlineCapable="true"` but unverified), and the Studio Pro design
   mode preview, which hasn't been written at all.

## Alternatives that were considered and rejected

- **Single flat data source, group client-side.** Simpler, no filter API, zero
  round trips after load — but breaks past a few hundred rows because of data
  source paging. Viable if the widget is ever scoped to small reference data.
- **`selection` property type (`SelectionMultiValue`) instead of a ReferenceSet.**
  Right choice if the output should feed a "Listen to data source" data view
  elsewhere on the page. The ReferenceSet was chosen because the requirement was
  to capture a selection onto an object, not to drive another widget.
- **Not building at all.** Mendix's own Dropdown Filter (Data Widgets) already
  does association-based filtering, and the Combo Box handles multi-select over
  reference sets. If the requirement ever turns out to be "filter a grid" rather
  than "capture a selection", say so rather than extending this widget.
