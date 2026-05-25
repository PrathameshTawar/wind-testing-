/**
 * server.ts
 * MCP stdio server entry point for cursor-reader
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import CursorReaderMCP from './index.js';

const allowedRoots = process.env['CURSOR_READER_ROOTS']
  ? process.env['CURSOR_READER_ROOTS'].split(',').map(r => r.trim())
  : [process.cwd()];

const cursorReader = new CursorReaderMCP(allowedRoots);
const tools = cursorReader.getTools();

const server = new Server(
  { name: 'cursor-reader', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(args as Record<string, unknown>);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }],
      isError: true,
    };
  }
});

async function main() {
  await cursorReader.start();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
