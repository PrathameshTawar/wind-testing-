/**
 * example.ts
 * Example usage of the CursorReader MCP module
 */

import CursorReaderMCP from './index';

async function main() {
  // Initialize the MCP server with project roots
  const projectRoots = [
    '/home/user/my-project',
    '/home/user/another-project',
  ];

  const server = new CursorReaderMCP(projectRoots);

  try {
    // Start the server
    console.log('Starting CursorReader MCP Server...');
    await server.start();

    // Example 1: List projects
    console.log('\n=== List Projects ===');
    const projectsResponse = await server.handleRequest({
      method: 'list_projects',
    });
    console.log(projectsResponse);

    // Example 2: Add a new project root
    console.log('\n=== Add Project Root ===');
    const addResponse = await server.handleRequest({
      method: 'add_project_root',
      params: { path: '/home/user/new-project' },
    });
    console.log(addResponse);

    // Example 3: Search code
    console.log('\n=== Search Code ===');
    const searchResponse = await server.handleRequest({
      method: 'search_code',
      params: {
        query: 'TODO',
        baseDir: '/home/user/my-project',
        maxResults: 10,
      },
    });
    console.log(searchResponse);

    // Example 4: Get recent changes
    console.log('\n=== Recent Changes ===');
    const changesResponse = await server.handleRequest({
      method: 'get_recent_changes',
      params: { count: 5 },
    });
    console.log(changesResponse);

    // Example 5: Get prompt history
    console.log('\n=== Prompt History ===');
    const promptsResponse = await server.handleRequest({
      method: 'get_prompt_history',
    });
    console.log(promptsResponse);

    // Example 6: Get server status
    console.log('\n=== Server Status ===');
    const statusResponse = await server.handleRequest({
      method: 'get_status',
    });
    console.log(statusResponse);

    // Stop the server
    console.log('\n\nStopping server...');
    await server.stop();
    console.log('Server stopped');
  } catch (error) {
    console.error('Error:', error);
    await server.stop();
  }
}

// Run example
main().catch(console.error);
