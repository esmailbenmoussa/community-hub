/**
 * Custom Vite plugin to convert AMD modules to ESM.
 * Specifically designed to handle azure-devops-extension-api modules.
 *
 * The ADO API uses this AMD pattern:
 * define(["require", "exports", "./Dep1", "./Dep2"], function(require, exports, Dep1, Dep2) {
 *   "use strict";
 *   // module code that assigns to exports
 * });
 */

import type { Plugin } from 'vite';
import { readFileSync } from 'fs';

interface AmdToEsmOptions {
  /** Glob pattern for files to include */
  include?: RegExp;
}

/**
 * Resolve a module import path relative to the file being transformed.
 * Converts relative paths to package-absolute paths for browser compatibility.
 *
 * @param moduleId - The import path (e.g., './Fetch', '../Utils')
 * @param filePath - The full path of the file being transformed
 * @returns Resolved import path (e.g., 'azure-devops-extension-api/Common/Fetch')
 */
function resolveImportPath(moduleId: string, filePath: string): string {
  // External packages - return as-is
  if (moduleId === 'azure-devops-extension-sdk') {
    return 'azure-devops-extension-sdk';
  }
  if (moduleId === 'whatwg-fetch') {
    return 'whatwg-fetch';
  }

  // For relative paths, resolve to package-absolute paths
  if (moduleId.startsWith('./') || moduleId.startsWith('../')) {
    // Check if this is a file from azure-devops-extension-api
    const packageMatch = filePath.match(
      /azure-devops-extension-api[\/\\](.+)$/
    );
    if (packageMatch) {
      // Get the directory of the current file within the package
      const filePathInPackage = packageMatch[1]; // e.g., "Common/RestClientBase.js"
      const dirInPackage = filePathInPackage.replace(/[\/\\][^\/\\]+$/, ''); // e.g., "Common"

      // Resolve the relative path
      const parts = dirInPackage.split(/[\/\\]/);
      const moduleParts = moduleId.split('/');

      for (const part of moduleParts) {
        if (part === '.') {
          continue;
        } else if (part === '..') {
          parts.pop();
        } else {
          parts.push(part);
        }
      }

      return `azure-devops-extension-api/${parts.join('/')}`;
    }
  }

  // For non-relative paths, return as-is
  return moduleId;
}

/**
 * Parse AMD define() call and extract dependencies, factory function body, and preamble
 */
function parseAmdModule(code: string): {
  preamble: string;
  deps: string[];
  params: string[];
  body: string;
} | null {
  // First, find where define() starts to extract the preamble
  // The preamble contains TypeScript helpers like __extends, __awaiter, __generator
  const defineStartRegex = /define\s*\(\s*\[/;
  const defineStartMatch = code.match(defineStartRegex);

  if (!defineStartMatch || defineStartMatch.index === undefined) {
    return null;
  }

  // Extract preamble (everything before define())
  const preamble = code.substring(0, defineStartMatch.index).trim();

  // Match: define(["require", "exports", ...deps], function(require, exports, ...params) { body });
  // or: define(["require", "exports", ...deps], function(require, exports, ...params) { body })
  const defineRegex =
    /define\s*\(\s*\[\s*([\s\S]*?)\s*\]\s*,\s*function\s*\(\s*([\s\S]*?)\s*\)\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/;

  const match = code.match(defineRegex);
  if (!match) {
    return null;
  }

  const [, depsStr, paramsStr, body] = match;

  // Parse dependencies array
  const deps = depsStr
    .split(',')
    .map((d) => d.trim().replace(/^["']|["']$/g, ''))
    .filter((d) => d.length > 0);

  // Parse parameter names
  const params = paramsStr
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return { preamble, deps, params, body };
}

/**
 * Convert AMD module to ESM
 */
function convertAmdToEsm(code: string, filePath: string): string {
  const parsed = parseAmdModule(code);
  if (!parsed) {
    // Not an AMD module or can't parse it, return as-is
    return code;
  }

  const { preamble, deps, params, body } = parsed;

  const imports: string[] = [];
  const paramToImport: Map<string, string> = new Map();

  // Process dependencies
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const param = params[i];

    // Skip "require" and "exports" - they're handled specially
    if (dep === 'require' || dep === 'exports') {
      continue;
    }

    // Resolve the module import path
    const resolvedDep = resolveImportPath(dep, filePath);

    // Generate unique import name based on param
    if (param) {
      imports.push(`import * as ${param} from '${resolvedDep}';`);
      paramToImport.set(param, resolvedDep);
    }
  }

  // Process the body to convert exports pattern
  let processedBody = body;

  // Handle "use strict" - we'll add it at the top
  processedBody = processedBody.replace(/^\s*["']use strict["']\s*;?\s*/m, '');

  // Handle Object.defineProperty(exports, "__esModule", { value: true });
  processedBody = processedBody.replace(
    /Object\.defineProperty\s*\(\s*exports\s*,\s*["']__esModule["']\s*,\s*\{\s*value\s*:\s*true\s*\}\s*\)\s*;?/g,
    ''
  );

  // Handle __exportStar pattern (TypeScript's export * helper)
  // __exportStar(require("./Module"), exports);
  processedBody = processedBody.replace(
    /__exportStar\s*\(\s*(\w+)\s*,\s*exports\s*\)\s*;?/g,
    (_match, moduleParam) => {
      return `export * from '${paramToImport.get(moduleParam) || moduleParam}';`;
    }
  );

  // Handle __export pattern used in index files
  // function __export(m) { for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p]; }
  // __export(Module_1);
  const hasExportHelper = processedBody.includes('function __export');
  if (hasExportHelper) {
    // Remove the __export helper function definition
    processedBody = processedBody.replace(
      /function\s+__export\s*\(\s*\w+\s*\)\s*\{[\s\S]*?\}\s*/g,
      ''
    );

    // Convert __export(param) calls to export * from 'module'
    const entries = Array.from(paramToImport.entries());
    for (const [param, modulePath] of entries) {
      const exportCallRegex = new RegExp(
        `__export\\s*\\(\\s*${param}\\s*\\)\\s*;?`,
        'g'
      );
      processedBody = processedBody.replace(
        exportCallRegex,
        `export * from '${modulePath}';`
      );
    }
  }

  // IMPORTANT: Handle enum patterns FIRST before other exports transformations
  // Pattern: (function (X) { ... })(X = exports.X || (exports.X = {}));
  // With preceding: var X;
  processedBody = processedBody.replace(
    /var\s+(\w+)\s*;\s*\(function\s*\(\1\)\s*\{([\s\S]*?)\}\)\s*\(\s*\1\s*=\s*exports\.\1\s*\|\|\s*\(exports\.\1\s*=\s*\{\}\)\s*\)\s*;?/g,
    (_match, enumName, enumBody) => {
      return `export var ${enumName};\n(function (${enumName}) {${enumBody}})(${enumName} || (${enumName} = {}));`;
    }
  );

  // Handle var X = exports.X = ... pattern (TypeScript enum/class exports)
  // This must come before simpler exports patterns
  processedBody = processedBody.replace(
    /var\s+(\w+)\s*=\s*exports\.\1\s*=/g,
    'export var $1 ='
  );

  // Handle exports.X = X; pattern (simple re-export of same name)
  // Must be specific to avoid matching partial patterns
  processedBody = processedBody.replace(
    /exports\.(\w+)\s*=\s*\1\s*;/g,
    'export { $1 };'
  );

  // Handle exports.X = Y; pattern (re-export with different name)
  processedBody = processedBody.replace(
    /exports\.(\w+)\s*=\s*(\w+)\s*;/g,
    (_match, exportName, value) => {
      if (exportName === value) {
        return `export { ${exportName} };`;
      }
      return `export { ${value} as ${exportName} };`;
    }
  );

  // Handle exports.X = expression (more complex case like function assignments)
  // But NOT if it's part of an || pattern (which would be enum initialization)
  // Using negative lookahead to avoid matching enum patterns
  processedBody = processedBody.replace(
    /exports\.(\w+)\s*=\s*(?!exports\.|\w+\s*;)([^;]+;)/g,
    'export const $1 = $2'
  );

  // Build final ESM code
  let result = '';

  // Add preamble (TypeScript helpers like __extends, __awaiter, __generator)
  // These are defined outside the define() block and need to be preserved
  if (preamble) {
    // Remove any license comments at the start (they can stay but let's clean up)
    // Keep the helper functions
    result += preamble + '\n\n';
  }

  // Add imports at the top (after preamble since helpers don't depend on imports)
  if (imports.length > 0) {
    result += imports.join('\n') + '\n\n';
  }

  // Add processed body
  result += processedBody.trim();

  // If there's still 'export *' in the result from our transformations, we need to remove the imports
  // for those modules since export * already re-exports everything
  const exportStarModules = new Set<string>();
  const exportStarRegex = /export \* from ['"]([^'"]+)['"]/g;
  let exportMatch;
  while ((exportMatch = exportStarRegex.exec(result)) !== null) {
    exportStarModules.add(exportMatch[1]);
  }

  // Remove redundant imports for modules that are already export *'d
  const modulesToRemove = Array.from(exportStarModules);
  for (const modulePath of modulesToRemove) {
    const importRegex = new RegExp(
      `import \\* as \\w+ from ['"]${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\n?`,
      'g'
    );
    result = result.replace(importRegex, '');
  }

  return result;
}

/**
 * Vite plugin to convert AMD modules to ESM
 *
 * Uses the `load` hook instead of `transform` because:
 * 1. `load` runs earlier in Vite's pipeline (before transform)
 * 2. By providing content in `load`, Vite never sees the original AMD code
 * 3. This prevents race conditions where Vite might analyze exports before transformation
 */
export function amdToEsm(options: AmdToEsmOptions = {}): Plugin {
  const include = options.include || /azure-devops-extension-api/;

  return {
    name: 'vite-plugin-amd-to-esm',
    enforce: 'pre',

    load(id: string) {
      // Only process files matching the include pattern
      if (!include.test(id)) {
        return null;
      }

      // Only process JS files (handle query strings like ?v=xxx)
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('.js')) {
        return null;
      }

      try {
        // Read the file content ourselves
        const code = readFileSync(cleanId, 'utf-8');

        // Check if this looks like an AMD module
        if (!code.includes('define(')) {
          return null;
        }

        const transformed = convertAmdToEsm(code, cleanId);
        return {
          code: transformed,
          map: null,
        };
      } catch (error) {
        console.error(`[amd-to-esm] Failed to load/transform ${id}:`, error);
        return null;
      }
    },
  };
}

export default amdToEsm;
