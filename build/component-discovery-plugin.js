/**
 * Component Discovery Plugin for Webpack
 *
 * Discovers components under src/components/STAR-STAR/component.meta.ts at build time,
 * validates metadata, and generates:
 * - components.registry.ts (typed registry and navigation)
 * - generated-components.module.ts (NestJS DynamicModule)
 */

const fs = require('fs');
const path = require('path');

class ComponentDiscoveryPlugin {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.componentsDir = path.join(this.rootDir, 'src', 'components');
    this.outputDir = path.join(this.rootDir, 'src', 'components.generated');
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('ComponentDiscoveryPlugin', (params, callback) => {
      try {
        console.log('[ComponentDiscovery] Starting component discovery...');

        const components = this.discoverComponents();
        const validationErrors = this.validateComponents(components);

        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            console.error(`[ComponentDiscovery] ${err.severity.toUpperCase()}: ${err.message}`);
          });

          const errorMessages = validationErrors
            .filter(e => e.severity === 'error')
            .map(e => e.message)
            .join('\n');

          if (errorMessages) {
            callback(new Error(`Component validation failed:\n${errorMessages}`));
            return;
          }
        }

        this.generateRegistryFile(components);
        this.generateModuleFile(components);

        console.log(`[ComponentDiscovery] Successfully discovered ${components.length} component(s)`);
        callback();
      } catch (error) {
        console.error('[ComponentDiscovery] Error during component discovery:', error);
        callback(error);
      }
    });

    compiler.hooks.afterCompile.tap('ComponentDiscoveryPlugin', (compilation) => {
      compilation.contextDependencies.add(this.componentsDir);
    });
  }

  discoverComponents() {
    const components = [];
    if (!fs.existsSync(this.componentsDir)) {
      console.warn(`[ComponentDiscovery] Components directory not found: ${this.componentsDir}`);
      return components;
    }

    const discoverInDir = (dir, relativePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'components.generated' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          const metaPath = path.join(fullPath, 'component.meta.ts');
          const modulePath = path.join(fullPath, 'component.module.ts');
          if (fs.existsSync(metaPath) && fs.existsSync(modulePath)) {
            try {
              delete require.cache[require.resolve(metaPath)];
              delete require.cache[require.resolve(modulePath)];
              const metaModule = require(metaPath);
              const componentMeta = metaModule.componentMeta;
              if (!componentMeta) {
                console.warn(`[ComponentDiscovery] No 'componentMeta' export found in ${metaPath}`);
                continue;
              }
              components.push({
                ...componentMeta,
                folderPath: fullPath,
              });
            } catch (error) {
              console.error(`[ComponentDiscovery] Error loading component from ${metaPath}:`, error.message);
            }
          } else {
            discoverInDir(fullPath, relPath);
          }
        }
      }
    };
    discoverInDir(this.componentsDir);
    return components;
  }

  validateComponents(components) {
    const errors = [];
    const seenIds = new Map();
    const seenPaths = new Map();
    for (const component of components) {
      if (!component.id) {
        errors.push({
          featureId: component.id || 'unknown',
          severity: 'error',
          message: `Component at ${component.folderPath} is missing required 'id' field`,
          filePath: path.join(component.folderPath, 'component.meta.ts'),
          field: 'id',
        });
        continue;
      }
      if (!component.title) {
        errors.push({
          featureId: component.id,
          severity: 'error',
          message: `Component '${component.id}' is missing required 'title' field`,
          filePath: path.join(component.folderPath, 'component.meta.ts'),
          field: 'title',
        });
      }
      if (!component.routes || !Array.isArray(component.routes) || component.routes.length === 0) {
        errors.push({
          featureId: component.id,
          severity: 'error',
          message: `Component '${component.id}' must have at least one route`,
          filePath: path.join(component.folderPath, 'component.meta.ts'),
          field: 'routes',
        });
        continue;
      }
      if (seenIds.has(component.id)) {
        const other = seenIds.get(component.id);
        errors.push({
          featureId: component.id,
          severity: 'error',
          message: `Duplicate component ID '${component.id}' found in:\n  - ${other.folderPath}\n  - ${component.folderPath}`,
          filePath: path.join(component.folderPath, 'component.meta.ts'),
          field: 'id',
        });
      } else {
        seenIds.set(component.id, component);
      }
      let primaryCount = 0;
      for (const route of component.routes) {
        if (!route.path) {
          errors.push({
            featureId: component.id,
            severity: 'error',
            message: `Component '${component.id}' has a route missing 'path' field`,
            filePath: path.join(component.folderPath, 'component.meta.ts'),
            field: 'routes[].path',
          });
          continue;
        }
        if (!route.title) {
          errors.push({
            featureId: component.id,
            severity: 'error',
            message: `Component '${component.id}' route '${route.path}' is missing 'title' field`,
            filePath: path.join(component.folderPath, 'component.meta.ts'),
            field: 'routes[].title',
          });
        }
        if (seenPaths.has(route.path)) {
          const other = seenPaths.get(route.path);
          errors.push({
            featureId: component.id,
            severity: 'error',
            message: `Duplicate route path '${route.path}' found in components '${other.id}' and '${component.id}'`,
            filePath: path.join(component.folderPath, 'component.meta.ts'),
            field: 'routes[].path',
          });
        } else {
          seenPaths.set(route.path, component);
        }
        if (route.isPrimary) primaryCount++;
      }
      if (primaryCount > 1) {
        errors.push({
          featureId: component.id,
          severity: 'error',
          message: `Component '${component.id}' has ${primaryCount} primary routes, but only one is allowed`,
          filePath: path.join(component.folderPath, 'component.meta.ts'),
          field: 'routes[].isPrimary',
        });
      }
      if (component.nav) {
        if (!component.nav.label) {
          errors.push({
            featureId: component.id,
            severity: 'error',
            message: `Component '${component.id}' has 'nav' but is missing 'nav.label'`,
            filePath: path.join(component.folderPath, 'component.meta.ts'),
            field: 'nav.label',
          });
        }
        const hasPrimary = component.routes.some(r => r.isPrimary);
        if (!hasPrimary) {
          errors.push({
            featureId: component.id,
            severity: 'error',
            message: `Component '${component.id}' has 'nav' but no primary route. Explicitly mark one route with isPrimary: true to indicate which route the navigation should link to.`,
            filePath: path.join(component.folderPath, 'component.meta.ts'),
            field: 'routes[].isPrimary',
          });
        }
      }
    }
    return errors;
  }

  generateRegistryFile(components) {
    const navigation = this.computeNavigation(components);
    const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by ComponentDiscoveryPlugin
 * 
 * This file contains the registry of all discovered components and computed navigation.
 */

import type { Component, NavigationEntry } from '../components/types';

/**
 * All discovered components
 */
export const components: Component[] = ${JSON.stringify(components, null, 2)};

/**
 * Computed navigation entries (sorted by order, then label)
 */
export const navigation: NavigationEntry[] = ${JSON.stringify(navigation, null, 2)};
`;
    const registryPath = path.join(this.outputDir, 'components.registry.ts');
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(registryPath, content, 'utf8');
  }

  generateModuleFile(components) {
    const imports = [];
    const moduleNames = [];
    for (const component of components) {
      const moduleName = this.getModuleName(component.id);
      const relativePath = path.relative(this.outputDir, path.join(component.folderPath, 'component.module'));
      const importPath = relativePath.replace(/\\/g, '/');
      imports.push(`import { ${moduleName} } from '${importPath}';`);
      moduleNames.push(moduleName);
    }
    const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by ComponentDiscoveryPlugin
 * 
 * This module aggregates all discovered component modules.
 */

import { Module } from '@nestjs/common';
${imports.join('\n')}

/**
 * Dynamic module that imports all discovered component modules
 */
@Module({
  imports: [${moduleNames.join(', ')}],
})
export class GeneratedComponentsModule {}
`;
    const modulePath = path.join(this.outputDir, 'generated-components.module.ts');
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(modulePath, content, 'utf8');
  }

  computeNavigation(components) {
    const entries = [];
    for (const component of components) {
      if (!component.nav) continue;
      const primaryRoute = component.routes.find(r => r.isPrimary) || component.routes[0];
      if (primaryRoute) {
        entries.push({ label: component.nav.label, path: primaryRoute.path, order: component.nav.order });
      }
    }
    entries.sort((a, b) => {
      if (a.order === undefined && b.order === undefined) return a.label.localeCompare(b.label);
      if (a.order === undefined) return 1;
      if (b.order === undefined) return -1;
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
    return entries;
  }

  getModuleName(componentId) {
    return componentId
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'ComponentModule';
  }
}

module.exports = ComponentDiscoveryPlugin;
