# Troubleshooting: @noble/curves Module Resolution

## Problem

Browser build fails with:
```
Module not found: Can't resolve '@noble/curves/abstract/utils'
```

This occurs when using compiled npm packages (like `tokamak-l2js`) that import `@noble/curves` subpath exports, while webpack tries to resolve them in a CJS context.

## Root Cause

1. **Original Manager App**: Uses TypeScript source from submodule
   - Webpack compiles TypeScript → naturally resolves `@noble/curves/misc.js`
   - No special configuration needed

2. **New App**: Uses compiled npm package (`tokamak-l2js`)
   - Package contains pre-compiled JavaScript with `import { jubjub } from "@noble/curves/misc.js"`
   - Webpack must resolve subpath exports from `package.json` exports field
   - CJS packages (like `ox` from viem) use `require("@noble/curves/abstract/utils")` which webpack struggles to resolve

## Solutions

### Solution 1: Enable webpack exportsFields (Recommended)

Configure webpack to properly read `package.json` exports field:

```javascript
// next.config.js
webpack: (config, { isServer }) => {
  if (!isServer) {
    // Ensure webpack reads package.json exports field
    config.resolve.conditionNames = ['import', 'require', 'default'];
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
  }
  return config;
}
```

### Solution 2: Use webpack alias with direct paths

Map subpath imports to actual file paths:

```javascript
// next.config.js
webpack: (config, { isServer }) => {
  if (!isServer) {
    const path = require("path");
    const nobleCurvesRoot = path.dirname(
      require.resolve("@noble/curves/package.json")
    );
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@noble/curves/abstract/utils": path.join(nobleCurvesRoot, "abstract", "utils.js"),
      "@noble/curves/misc": path.join(nobleCurvesRoot, "misc.js"),
    };
  }
  return config;
}
```

### Solution 3: Use transpilePackages (May not work for compiled packages)

```javascript
// next.config.js
transpilePackages: ['tokamak-l2js'],
```

**Note**: This may not work if the package is already compiled to JavaScript.

### Solution 4: Use server-side only (Not ideal)

Move MPT key generation to API route (already implemented in `/api/mpt-key/generate`).

**Pros**: Avoids browser module resolution issues
**Cons**: Requires network round-trip, less secure (signature sent to server)

## Recommended Approach

**Use Solution 1 + Solution 2 combination**:

1. Enable `conditionNames` to read exports field
2. Add specific aliases for problematic subpaths
3. Ensure `@noble/curves` is installed as direct dependency

## Testing

After applying solution, test:
1. Browser console should not show module resolution errors
2. MPT key generation should work in browser
3. `npm run test:tokamak-l2js` should still pass (Node.js environment)
