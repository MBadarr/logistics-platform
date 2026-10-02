import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Only print build settings and dependency paths, never application secrets.
console.log('Build environment:', {
  node: process.version,
  platform: process.platform,
  architecture: process.arch,
  cwd: process.cwd(),
  NODE_ENV: process.env.NODE_ENV,
  NPM_CONFIG_PRODUCTION: process.env.NPM_CONFIG_PRODUCTION,
});

for (const workspace of ['.', 'packages/database', 'apps/api']) {
  const manifestPath = resolve(workspace, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  console.log(`\n${manifest.name}:`, {
    declaredTypeScript: manifest.devDependencies?.typescript,
    nodeModulesPresent: existsSync(resolve(workspace, 'node_modules')),
    tscLinkPresent: existsSync(resolve(workspace, 'node_modules/.bin/tsc')),
  });
  try {
    const require = createRequire(manifestPath);
    const installedPath = require.resolve('typescript/package.json');
    const installed = JSON.parse(readFileSync(installedPath, 'utf8'));
    const compiler = join(dirname(installedPath), installed.bin.tsc);
    console.log('Resolved TypeScript:', { version: installed.version, path: realpathSync(installedPath), compilerPresent: existsSync(compiler) });
    const result = spawnSync(process.execPath, [compiler, '--version'], { encoding: 'utf8' });
    console.log('Compiler stdout:', result.stdout?.trim());
    console.log('Compiler stderr:', result.stderr?.trim());
    console.log('Compiler exit:', result.status, result.error?.message ?? '');
    if (result.status !== 0) process.exitCode = 1;
  } catch (error) {
    console.error('Dependency resolution failed:', error.message);
    process.exitCode = 1;
  }
}
