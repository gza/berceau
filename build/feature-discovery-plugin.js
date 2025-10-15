/**
 * Feature Discovery Plugin for Webpack
 * 
 * Discovers features under src/components/STAR-STAR/feature.meta.ts at build time,
 * validates metadata, and generates:
 * - features.registry.ts (typed registry and navigation)
 * - generated-features.module.ts (NestJS DynamicModule)
 */

const fs = require('fs');
const path = require('path');

class FeatureDiscoveryPlugin {
  /**
   * @param {Object} options - Plugin options
   * @param {string} options.rootDir - Root directory of the project
   */
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.componentsDir = path.join(this.rootDir, 'src', 'components');
    this.outputDir = path.join(this.rootDir, 'src', 'components.generated');
  }

  /**
   * Apply plugin to webpack compiler
   * Hooks into beforeCompile to discover and validate features before TypeScript compilation
   * 
   * @param {Object} compiler - Webpack compiler instance
   */
  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('FeatureDiscoveryPlugin', (params, callback) => {
      try {
        console.log('[FeatureDiscovery] Starting feature discovery...');
        
        const features = this.discoverFeatures();
        const validationErrors = this.validateFeatures(features);
        
        if (validationErrors.length > 0) {
          validationErrors.forEach(err => {
            console.error(`[FeatureDiscovery] ${err.severity.toUpperCase()}: ${err.message}`);
          });
          
          const errorMessages = validationErrors
            .filter(e => e.severity === 'error')
            .map(e => e.message)
            .join('\n');
          
          if (errorMessages) {
            callback(new Error(`Feature validation failed:\n${errorMessages}`));
            return;
          }
        }
        
        this.generateRegistryFile(features);
        this.generateModuleFile(features);
        
        console.log(`[FeatureDiscovery] Successfully discovered ${features.length} feature(s)`);
        callback();
      } catch (error) {
        console.error('[FeatureDiscovery] Error during feature discovery:', error);
        callback(error);
      }
    });

    // Add context dependency to trigger rebuilds when feature files change
    compiler.hooks.afterCompile.tap('FeatureDiscoveryPlugin', (compilation) => {
      // Watch the entire components directory for changes
      compilation.contextDependencies.add(this.componentsDir);
    });
  }

  /**
   * Discover all features by scanning for feature.meta.ts files
   * Recursively searches src/components/ for folders containing both:
   * - feature.meta.ts (with exported featureMeta constant)
   * - feature.module.ts (NestJS module)
   * 
   * @returns {Array<Object>} Array of discovered features with metadata and folder paths
   */
  discoverFeatures() {
    const features = [];
    
    if (!fs.existsSync(this.componentsDir)) {
      console.warn(`[FeatureDiscovery] Components directory not found: ${this.componentsDir}`);
      return features;
    }
    
    const discoverInDir = (dir, relativePath = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip generated, node_modules, and hidden directories
          if (entry.name === 'components.generated' || 
              entry.name === 'node_modules' || 
              entry.name.startsWith('.')) {
            continue;
          }
          
          // Check for feature.meta.ts in this directory
          const metaPath = path.join(fullPath, 'feature.meta.ts');
          const modulePath = path.join(fullPath, 'feature.module.ts');
          
          if (fs.existsSync(metaPath) && fs.existsSync(modulePath)) {
            try {
              // Clear require cache to get fresh data during watch/HMR
              delete require.cache[require.resolve(metaPath)];
              delete require.cache[require.resolve(modulePath)];
              
              const metaModule = require(metaPath);
              const featureMeta = metaModule.featureMeta;
              
              if (!featureMeta) {
                console.warn(`[FeatureDiscovery] No 'featureMeta' export found in ${metaPath}`);
                continue;
              }
              
              features.push({
                ...featureMeta,
                folderPath: fullPath,
              })
            } catch (error) {
              console.error(
                `[FeatureDiscovery] Error loading feature from ${metaPath}:`,
                error.message,
              )
            }
          } else {
            // Recurse into subdirectories
            discoverInDir(fullPath, relPath);
          }
        }
      }
    };
    
    discoverInDir(this.componentsDir);
    return features;
  }

  /**
   * Validate discovered features against schema and business rules
   * 
   * Validates:
   * - Required fields (id, title, routes)
   * - Unique feature IDs
   * - Unique route paths across all features
   * - Maximum one primary route per feature
   * - Features with 'nav' must have exactly one primary route
   * 
   * @param {Array<Object>} features - Discovered features to validate
   * @returns {Array<Object>} Array of validation errors with severity and messages
   */
  validateFeatures(features) {
    const errors = [];
    const seenIds = new Map();
    const seenPaths = new Map();
    
    for (const feature of features) {
      // Validate required fields
      if (!feature.id) {
        errors.push({
          featureId: feature.id || 'unknown',
          severity: 'error',
          message: `Feature at ${feature.folderPath} is missing required 'id' field`,
          filePath: path.join(feature.folderPath, 'feature.meta.ts'),
          field: 'id',
        });
        continue;
      }
      
      if (!feature.title) {
        errors.push({
          featureId: feature.id,
          severity: 'error',
          message: `Feature '${feature.id}' is missing required 'title' field`,
          filePath: path.join(feature.folderPath, 'feature.meta.ts'),
          field: 'title',
        });
      }
      
      if (!feature.routes || !Array.isArray(feature.routes) || feature.routes.length === 0) {
        errors.push({
          featureId: feature.id,
          severity: 'error',
          message: `Feature '${feature.id}' must have at least one route`,
          filePath: path.join(feature.folderPath, 'feature.meta.ts'),
          field: 'routes',
        });
        continue;
      }
      
      // Check for duplicate feature IDs
      if (seenIds.has(feature.id)) {
        const otherFeature = seenIds.get(feature.id);
        errors.push({
          featureId: feature.id,
          severity: 'error',
          message: `Duplicate feature ID '${feature.id}' found in:\n  - ${otherFeature.folderPath}\n  - ${feature.folderPath}`,
          filePath: path.join(feature.folderPath, 'feature.meta.ts'),
          field: 'id',
        });
      } else {
        seenIds.set(feature.id, feature);
      }
      
      // Validate routes
      let primaryCount = 0;
      for (const route of feature.routes) {
        if (!route.path) {
          errors.push({
            featureId: feature.id,
            severity: 'error',
            message: `Feature '${feature.id}' has a route missing 'path' field`,
            filePath: path.join(feature.folderPath, 'feature.meta.ts'),
            field: 'routes[].path',
          });
          continue;
        }
        
        if (!route.title) {
          errors.push({
            featureId: feature.id,
            severity: 'error',
            message: `Feature '${feature.id}' route '${route.path}' is missing 'title' field`,
            filePath: path.join(feature.folderPath, 'feature.meta.ts'),
            field: 'routes[].title',
          });
        }
        
        // Check for duplicate route paths
        if (seenPaths.has(route.path)) {
          const otherFeature = seenPaths.get(route.path);
          errors.push({
            featureId: feature.id,
            severity: 'error',
            message: `Duplicate route path '${route.path}' found in features '${otherFeature.id}' and '${feature.id}'`,
            filePath: path.join(feature.folderPath, 'feature.meta.ts'),
            field: 'routes[].path',
          });
        } else {
          seenPaths.set(route.path, feature);
        }
        
        if (route.isPrimary) {
          primaryCount++;
        }
      }
      
      // Check for multiple primary routes
      if (primaryCount > 1) {
        errors.push({
          featureId: feature.id,
          severity: 'error',
          message: `Feature '${feature.id}' has ${primaryCount} primary routes, but only one is allowed`,
          filePath: path.join(feature.folderPath, 'feature.meta.ts'),
          field: 'routes[].isPrimary',
        });
      }
      
      // Validate nav configuration if present
      if (feature.nav) {
        if (!feature.nav.label) {
          errors.push({
            featureId: feature.id,
            severity: 'error',
            message: `Feature '${feature.id}' has 'nav' but is missing 'nav.label'`,
            filePath: path.join(feature.folderPath, 'feature.meta.ts'),
            field: 'nav.label',
          });
        }
        
        // Check if there's a primary route for navigation
        const hasPrimary = feature.routes.some(r => r.isPrimary);
        if (!hasPrimary) {
          errors.push({
            featureId: feature.id,
            severity: 'error',
            message: `Feature '${feature.id}' has 'nav' but no primary route. Explicitly mark one route with isPrimary: true to indicate which route the navigation should link to.`,
            filePath: path.join(feature.folderPath, 'feature.meta.ts'),
            field: 'routes[].isPrimary',
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Generate features.registry.ts containing discovered features and computed navigation
   * This file is imported by application code to access feature metadata
   * 
   * @param {Array<Object>} features - Validated features to include in registry
   */
  generateRegistryFile(features) {
    const navigation = this.computeNavigation(features);
    
    const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by FeatureDiscoveryPlugin
 * 
 * This file contains the registry of all discovered features and computed navigation.
 */

import type { Feature, NavigationEntry } from '../components/types';

/**
 * All discovered features
 */
export const features: Feature[] = ${JSON.stringify(features, null, 2)};

/**
 * Computed navigation entries (sorted by order, then label)
 */
export const navigation: NavigationEntry[] = ${JSON.stringify(navigation, null, 2)};
`;
    
    const registryPath = path.join(this.outputDir, 'features.registry.ts');
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(registryPath, content, 'utf8');
  }

  /**
   * Generate generated-features.module.ts - NestJS DynamicModule that imports all features
   * This module is imported by app.module.ts to register all discovered features
   * 
   * @param {Array<Object>} features - Validated features to include in module
   */
  generateModuleFile(features) {
    const imports = [];
    const moduleNames = [];
    
    for (const feature of features) {
      const moduleName = this.getModuleName(feature.id);
      const relativePath = path.relative(this.outputDir, path.join(feature.folderPath, 'feature.module'));
      const importPath = relativePath.replace(/\\/g, '/');
      
      imports.push(`import { ${moduleName} } from '${importPath}';`);
      moduleNames.push(moduleName);
    }
    
    const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated by FeatureDiscoveryPlugin
 * 
 * This module aggregates all discovered feature modules.
 */

import { Module } from '@nestjs/common';
${imports.join('\n')}

/**
 * Dynamic module that imports all discovered feature modules
 */
@Module({
  imports: [${moduleNames.join(', ')}],
})
export class GeneratedFeaturesModule {}
`;
    
    const modulePath = path.join(this.outputDir, 'generated-features.module.ts');
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(modulePath, content, 'utf8');
  }

  /**
   * Compute navigation entries from features with 'nav' field
   * Navigation entries are sorted by order (ascending), then label (alphabetically)
   * Features without 'nav' or without a primary route are excluded
   * 
   * @param {Array<Object>} features - Features to compute navigation from
   * @returns {Array<Object>} Sorted navigation entries with label, path, and order
   */
  computeNavigation(features) {
    const entries = [];
    
    for (const feature of features) {
      if (!feature.nav) {
        continue;
      }
      
      // Find primary route or use first route
      const primaryRoute = feature.routes.find(r => r.isPrimary) || feature.routes[0];
      
      if (primaryRoute) {
        entries.push({
          label: feature.nav.label,
          path: primaryRoute.path,
          order: feature.nav.order,
        });
      }
    }
    
    // Sort by order (ascending), then by label (ascending)
    // undefined order values go last
    entries.sort((a, b) => {
      if (a.order === undefined && b.order === undefined) {
        return a.label.localeCompare(b.label);
      }
      if (a.order === undefined) return 1;
      if (b.order === undefined) return -1;
      
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      return a.label.localeCompare(b.label);
    });
    
    return entries;
  }

  /**
   * Get module class name from feature ID
   * Converts kebab-case or snake_case to PascalCase and appends "FeatureModule"
   * Example: 'user-dashboard' -> 'UserDashboardFeatureModule'
   * 
   * @param {string} featureId - Feature ID to convert
   * @returns {string} Module class name in PascalCase with "FeatureModule" suffix
   */
  getModuleName(featureId) {
    // Convert kebab-case or snake_case to PascalCase and append "Module"
    return featureId
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'FeatureModule';
  }
}

module.exports = FeatureDiscoveryPlugin;
