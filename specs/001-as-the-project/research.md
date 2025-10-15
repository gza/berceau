# Research: Component-scoped feature creation

Date: 2025-10-14
Branch: 001-as-the-project

## Questions and Decisions

1) Compile-time discovery with Webpack 5 while keeping strong types
- Decision: Use Webpack context to glob `src/components/**/component.meta.ts` and `src/components/**/component.module.ts`. Feed discovered modules into a small build plugin that validates metadata and emits generated TS files (`components.registry.ts` and `generated-components.module.ts`).
- Rationale: Ensures zero runtime FS scanning and enables typed imports for the aggregator module. Works in watch/HMR and can fail the build on validation errors.
- Alternatives considered: (a) Runtime `fs.readdir` scan — rejected per FR-012. (b) Manual registry edits — rejected per FR-002. (c) Babel/ts-node preprocess — extra complexity; Webpack context is native and already used in this repo.

2) Generating a NestJS DynamicModule to aggregate per-feature modules
- Decision: Emit `GeneratedComponentsModule` with `@Module({ imports: [ ...featureModules ] })` and export it. Ensure `AppModule` imports this generated module by a stable path.
- Rationale: Maximizes use of native NestJS module system; keeps feature autonomy. Generation avoids external file edits per feature.
- Alternatives: (a) Single controller that dispatches to features via registry — less Nest-native, harder to compose guards/providers. (b) Routing middleware — less idiomatic for NestJS modules.

3) Validation surfacing as build errors that block HMR
- Decision: Perform validation inside the codegen step; on any error (duplicate routes, invalid schema), throw a Webpack compilation error (`compilation.errors.push(new Error(...))`) so HMR/build fails.
- Rationale: Aligns with FR-005 and the spec’s error behavior. Keeps feedback fast in dev.
- Alternatives: (a) Runtime checks in bootstrap — too late; won’t block HMR updates reliably.

4) Metadata schema and placement
- Decision: `component.meta.ts` exporting `export const componentMeta = { ... } as const` with dedicated TS types to validate shape at compile time; runtime validation also performed during codegen.
- Rationale: Clear convention, simple to document, lives inside the feature folder.
- Alternatives: JSON files — less TypeScript-friendly; TS affords editor hints.

5) Navigation order and omission
- Decision: Optional `nav` with `{ label: string; order?: number }`; if omitted, no nav entry. When present, entries sorted by `order` ascending then by `label`.
- Rationale: Matches spec FR-012 and clarifications.

6) HMR detection and rebuild behavior
- Decision: Rely on Webpack watch mode; any add/remove/rename under `src/components/**/component.meta.ts` or `component.module.ts` triggers context invalidation and re-generation of aggregator files, then HMR applies if no validation errors.
- Rationale: Native behavior; no custom watchers needed.

## Implementation Blueprint

- Add a small codegen harness invoked from Webpack config (a custom plugin or a pre-build script) that:
  1. Discovers features via Webpack context.
  2. Imports each `component.meta.ts` and `component.module.ts` virtually.
  3. Validates:
     - Unique `feature.id` across all features
     - Unique route `path` across all features
     - Required fields present; paths valid
  4. Emits TS files under `src/components.generated/`:
  - `components.registry.ts`: array of Component definitions and computed nav entries
  - `generated-components.module.ts`: a NestJS DynamicModule importing component modules
  5. Emits readable diagnostics and fails compilation on error.

- Consumption points:
  - `AppModule` imports `GeneratedComponentsModule` from `src/components.generated/generated-components.module`
  - Navigation UI reads from `components.registry.ts` to build the left menu

## NestJS doc references (summary)
- Dynamic modules: Use `Module` metadata factory to compose imports; generated file exports a standard `@Module({ imports: [...] })`.
- Controllers per feature: Each feature exposes its own `@Controller` and routes; aggregation happens at module level via imports.

## Risks
- Type rigor vs dynamic discovery — mitigated by emitting code with explicit imports.
- Build perf at scale — batch validation and generate once per rebuild; avoid heavy FS IO.

