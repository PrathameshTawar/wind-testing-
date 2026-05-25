#!/usr/bin/env node

/**
 * cli.ts
 * Command-line interface for CursorReader MCP server
 */

import CursorReaderMCP from './index';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'start';



  try {
    switch (command) {
      case 'start':
        await startServer();
        break;

      case 'config':
        handleConfigCommand(args.slice(1));
        break;

      case 'test':
        await testServer();
        break;

      default:
        console.log(`
CursorReader MCP Server CLI

Usage:
  cursor-reader [command] [options]

Commands:
  start                       Start the MCP server (default)
  config [add-root] [path]    Add a project root to configuration
  config [list]               List configured project roots
  test                        Run basic tests
  help                        Show this help message
`);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function startServer() {
  console.log('Starting CursorReader MCP Server...');

  // For now, just initialize the server
  const defaultRoot = process.cwd();


  const server = new CursorReaderMCP([defaultRoot]);
  await server.start();

  // Setup REPL-like interface
  console.log('\nServer ready. Available methods:');
  console.log('  - list_projects');
  console.log('  - get_project_tree(projectPath)');
  console.log('  - read_file(filePath)');
  console.log('  - search_code(query, baseDir)');
  console.log('  - get_recent_changes()');
  console.log('  - get_latest_git_diff(projectPath)');
  console.log('  - get_prompt_history()');
  console.log('\nPress Ctrl+C to exit.\n');

  // Keep server running
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });
}

function handleConfigCommand(args: string[]) {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const configDir = path.join(homeDir, '.cursor-reader');
  const configPath = path.join(configDir, 'config.json');

  // Ensure config directory exists
  try {
    mkdirSync(configDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  if (args[0] === 'add-root' && args[1]) {
    const projectRoot = args[1];
    console.log(`Adding project root: ${projectRoot}`);

    let config: Record<string, unknown> = { projectRoots: [] };

    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch {
      // Config file doesn't exist yet
    }

    if (!Array.isArray(config.projectRoots)) {
      config.projectRoots = [];
    }

    const roots = config.projectRoots as string[];
    if (!roots.includes(projectRoot)) {
      roots.push(projectRoot);
      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('✓ Project root added');
    } else {
      console.log('Project root already configured');
    }
  } else if (args[0] === 'list') {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      const roots = config.projectRoots || [];

      if (roots.length === 0) {
        console.log('No project roots configured');
      } else {
        console.log('Configured project roots:');
        roots.forEach((root: string, i: number) => {
          console.log(`  ${i + 1}. ${root}`);
        });
      }
    } catch {
      console.log('No configuration found. Run: cursor-reader config add-root [path]');
    }
  }
}

async function testServer() {
  console.log('Testing CursorReader MCP Server...\n');

  const testRoot = process.cwd();
  const server = new CursorReaderMCP([testRoot]);

  try {
    console.log('✓ Server initialized');

    // Test list_tools
    const tools = server.getTools();
    console.log(`✓ Found ${tools.length} tools`);

    // Test config
    console.log(`✓ Config loaded`);

    // Test basic request
    await server.handleRequest({ method: 'list_projects' });
    console.log(`✓ list_projects method works`);


    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run main
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
