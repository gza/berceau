#!/usr/bin/env node
/**
 * Performance test script for feature discovery at scale
 * 
 * This script creates N mock features and measures discovery/validation time
 * to ensure the system meets the <3s incremental rebuild requirement.
 * 
 * Usage:
 *   node build/performance-test.js [featureCount]
 * 
 * Example:
 *   node build/performance-test.js 50
 *   node build/performance-test.js 100
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const MOCK_DIR = path.join(__dirname, '..', 'src', 'components', '__perf-test__');
const FEATURE_COUNT = parseInt(process.argv[2] || '50', 10);

/**
 * Generate a mock feature with metadata and module files
 */
function generateMockFeature(index) {
  const featureId = `perf-test-${index}`;
  const featureDir = path.join(MOCK_DIR, featureId);
  
  fs.mkdirSync(featureDir, { recursive: true });
  
  // feature.meta.ts
  const metaContent = `
import type { FeatureMeta } from '../../types';

export const featureMeta: FeatureMeta = {
  id: '${featureId}',
  title: 'Performance Test Feature ${index}',
  description: 'Generated for performance testing',
  routes: [
    { path: '/${featureId}', title: 'Test Page ${index}', isPrimary: true },
    { path: '/${featureId}/detail', title: 'Detail Page ${index}' },
  ],
  nav: { label: 'Test ${index}', order: ${index * 10} },
} as const;
`;
  
  fs.writeFileSync(path.join(featureDir, 'feature.meta.ts'), metaContent);
  
  // feature.module.ts
  const moduleContent = `
import { Module } from '@nestjs/common';

@Module({
  controllers: [],
})
export class PerfTest${index}FeatureModule {}
`;
  
  fs.writeFileSync(path.join(featureDir, 'feature.module.ts'), moduleContent);
}

/**
 * Clean up mock features
 */
function cleanupMockFeatures() {
  if (fs.existsSync(MOCK_DIR)) {
    fs.rmSync(MOCK_DIR, { recursive: true, force: true });
  }
}

/**
 * Setup cleanup handlers to ensure temp files are removed
 */
function setupCleanupHandlers() {
  const cleanup = () => {
    if (fs.existsSync(MOCK_DIR)) {
      fs.rmSync(MOCK_DIR, { recursive: true, force: true });
    }
  };

  // Clean up on normal exit
  process.on('exit', cleanup);
  
  // Clean up on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted. Cleaning up...');
    cleanup();
    process.exit(130);
  });
  
  // Clean up on SIGTERM
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });
  
  // Clean up on uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught exception:', error);
    cleanup();
    process.exit(1);
  });
  
  // Clean up on unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Unhandled rejection at:', promise, 'reason:', reason);
    cleanup();
    process.exit(1);
  });
}

/**
 * Run performance test
 */
async function runPerformanceTest() {
  console.log(`\n🧪 Feature Discovery Performance Test`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Creating ${FEATURE_COUNT} mock features...`);
  
  // Set up cleanup handlers before creating any files
  setupCleanupHandlers();
  
  const startSetup = performance.now();
  
  // Generate mock features
  for (let i = 1; i <= FEATURE_COUNT; i++) {
    generateMockFeature(i);
  }
  
  const endSetup = performance.now();
  const setupTime = endSetup - startSetup;
  
  console.log(`✓ Created ${FEATURE_COUNT} features in ${setupTime.toFixed(0)}ms\n`);
  
  // Load the plugin and test discovery
  const FeatureDiscoveryPlugin = require('./feature-discovery-plugin');
  const plugin = new FeatureDiscoveryPlugin({
    rootDir: path.join(__dirname, '..'),
  });
  
  console.log(`Running discovery and validation...`);
  const startDiscovery = performance.now();
  
  const features = plugin.discoverFeatures();
  
  const endDiscovery = performance.now();
  const discoveryTime = endDiscovery - startDiscovery;
  
  console.log(`✓ Discovered ${features.length} features in ${discoveryTime.toFixed(0)}ms\n`);
  
  console.log(`Running validation...`);
  const startValidation = performance.now();
  
  const errors = plugin.validateFeatures(features);
  
  const endValidation = performance.now();
  const validationTime = endValidation - startValidation;
  
  console.log(`✓ Validated ${features.length} features in ${validationTime.toFixed(0)}ms`);
  console.log(`  Errors: ${errors.length}\n`);
  
  console.log(`Running code generation...`);
  const startGeneration = performance.now();
  
  plugin.generateRegistryFile(features);
  plugin.generateModuleFile(features);
  
  const endGeneration = performance.now();
  const generationTime = endGeneration - startGeneration;
  
  console.log(`✓ Generated registry and module files in ${generationTime.toFixed(0)}ms\n`);
  
  // Calculate totals
  const totalTime = discoveryTime + validationTime + generationTime;
  
  console.log(`${'='.repeat(60)}`);
  console.log(`\n📊 Performance Summary:`);
  console.log(`\n  Features:        ${features.length}`);
  console.log(`  Discovery:       ${discoveryTime.toFixed(0)}ms`);
  console.log(`  Validation:      ${validationTime.toFixed(0)}ms`);
  console.log(`  Generation:      ${generationTime.toFixed(0)}ms`);
  console.log(`  Total:           ${totalTime.toFixed(0)}ms`);
  console.log(`\n  Time per feature: ${(totalTime / features.length).toFixed(2)}ms`);
  
  // Check against requirement
  const requirement = 3000; // 3 seconds
  const withinRequirement = totalTime < requirement;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n✓ Requirement: < ${requirement}ms for ${FEATURE_COUNT} features`);
  console.log(`  Result: ${totalTime.toFixed(0)}ms`);
  
  if (withinRequirement) {
    console.log(`  Status: ✅ PASS (${((requirement - totalTime) / requirement * 100).toFixed(1)}% under budget)\n`);
  } else {
    console.log(`  Status: ❌ FAIL (${((totalTime - requirement) / requirement * 100).toFixed(1)}% over budget)\n`);
  }
  
  // Cleanup
  console.log(`Cleaning up mock features...`);
  cleanupMockFeatures();
  console.log(`✓ Cleanup complete\n`);
  
  return withinRequirement ? 0 : 1;
}

// Run the test
runPerformanceTest()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('\n❌ Performance test failed:', error);
    cleanupMockFeatures();
    process.exit(1);
  });
