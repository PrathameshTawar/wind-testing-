"use strict";
/**
 * server.ts
 * MCP stdio server entry point for cursor-reader
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const index_js_2 = __importDefault(require("./index.js"));
const allowedRoots = process.env['CURSOR_READER_ROOTS']
    ? process.env['CURSOR_READER_ROOTS'].split(',').map(r => r.trim())
    : [process.cwd()];
const cursorReader = new index_js_2.default(allowedRoots);
const tools = cursorReader.getTools();
const server = new index_js_1.Server({ name: 'cursor-reader', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
    })),
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const tool = tools.find(t => t.name === name);
    if (!tool) {
        return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
        };
    }
    try {
        const result = await tool.handler(args);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }],
            isError: true,
        };
    }
});
async function main() {
    await cursorReader.start();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map