# ngx-query-builder — Demo App

A standalone Angular 19 application showcasing the `ngx-query-builder` library. The demo provides a live, interactive query builder with JSON output displayed in real time.

## Features Demonstrated

- **ReactiveFormsModule** integration — query bound to a `FormControl`
- **Entity mode** — fields filtered by selected entity
- **Allow collapse** — rulesets can be collapsed/expanded with animation
- **Persist value on field change** — values are preserved when switching between compatible field types
- **Disabled state** — toggling the entire query builder on/off
- **Custom textarea input** — overriding the default text input with a `<textarea>` via `*queryInput` template
- **Live JSON output** — rendered below the query builder as pretty-printed JSON

## Development Server

```bash
# From the workspace root:
npm start
# or
npx ng serve demo
```

Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

## Build

```bash
npx ng build demo
```

Build artifacts are written to `dist/demo/`.

## Notes

- The demo has **no unit tests** — it exists solely to showcase the library
- No e2e test suite is configured
- The demo uses the local `ngx-query-builder` package from `dist/ngx-query-builder` (or via Angular workspace path alias)
