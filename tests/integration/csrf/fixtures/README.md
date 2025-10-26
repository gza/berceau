# CSRF Test Fixtures

This directory contains test controller fixtures used by CSRF integration tests.

## Purpose

NestJS decorators require proper TypeScript metadata compilation to work correctly. When test controllers are defined inline within spec files, the TypeScript compiler sometimes fails to resolve decorator signatures properly, leading to lint errors like:

```
Unable to resolve signature of method decorator when called as an expression.
```

By extracting test controllers into separate fixture files, we ensure:
1. ✅ Proper TypeScript decorator metadata compilation
2. ✅ ESLint can parse and validate the code correctly
3. ✅ Test controllers can be reused across multiple test files
4. ✅ Cleaner separation of test setup from test logic

## Files

### test-opt-out.controller.ts
Test controller demonstrating method-level `@SkipCsrf()` decorator usage.

**Endpoints:**
- `POST /test-csrf-opt-out/api/data` - API endpoint with `@SkipCsrf()` (no token required)
- `POST /test-csrf-opt-out/protected` - Form endpoint without decorator (token required)

**Used by:** `opt-out.spec.ts` - Method-level opt-out tests

### test-opt-out-class.controller.ts
Test controller demonstrating class-level `@SkipCsrf()` decorator usage.

**Endpoints:**
- `POST /test-csrf-opt-out-class/api/endpoint1` - Class-level opt-out
- `POST /test-csrf-opt-out-class/api/endpoint2` - Class-level opt-out

**Used by:** `opt-out.spec.ts` - Class-level opt-out tests

### test-opt-out.module.ts
NestJS module that registers both test controllers for use in integration tests.

**Usage:**
```typescript
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule, TestOptOutModule],
}).compile()
```

## Configuration

These fixture files are included in the TypeScript compilation via `tsconfig.eslint.json`:

```json
{
  "include": [
    "src/**/*",
    "tests/**/*",  // ← Includes test fixtures
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

This ensures ESLint and TypeScript can properly parse and validate decorator metadata in fixture files.

## Best Practices

1. **Use fixtures for controller testing**: Always place test controllers in fixture files, not inline in spec files
2. **Keep fixtures focused**: Each fixture should test a specific decorator or feature
3. **Document endpoints**: Clearly document what each fixture endpoint does and whether it requires CSRF tokens
4. **Reuse fixtures**: If multiple test files need the same controller, reuse the fixture rather than duplicating

## Troubleshooting

### "Unable to resolve signature of method decorator"
This error occurs when TypeScript can't compile decorator metadata. Solutions:
- ✅ Move controller to a fixture file in `tests/integration/csrf/fixtures/`
- ✅ Ensure `tests/` is included in `tsconfig.eslint.json`
- ✅ Verify `experimentalDecorators` and `emitDecoratorMetadata` are enabled in `tsconfig.json`

### "ESLint was configured to run on... However, that TSConfig does not include this file"
This error means the file path is not in `tsconfig.eslint.json`. Add `tests/**/*` to the `include` array.

### Decorator errors persist after fixture creation
1. Run `npm run lint` to see specific errors
2. Verify TypeScript compiler options in `tsconfig.json`
3. Check that fixture files import decorators correctly from `@nestjs/common`
