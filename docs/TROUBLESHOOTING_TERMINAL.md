# Troubleshooting: Terminal Command Execution Issues

## Problem

When running terminal commands through Cursor's AI assistant, you may encounter errors like:

```
_encode:25: command not found: -e
```

This typically occurs when the default shell environment has issues with command execution.

## Solution: Use Bash Explicitly

If you encounter terminal execution errors, always use `bash -c` to wrap your commands:

### Git Commands

**❌ Don't:**
```bash
git add -A
git commit -m "message"
```

**✅ Do:**
```bash
bash -c "cd /path/to/project && git add -A && git commit -m 'message'"
```

### General Commands

**❌ Don't:**
```bash
npm install
npm run build
```

**✅ Do:**
```bash
bash -c "cd /path/to/project && npm install"
bash -c "cd /path/to/project && npm run build"
```

## Best Practices

1. **Always use `bash -c`** when running commands through Cursor's terminal tool
2. **Combine commands with `&&`** for sequential execution
3. **Use absolute paths** when possible
4. **Quote command strings properly** to handle spaces and special characters

## Examples

### Git Operations

```bash
# Stage specific files
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && git add app/state-explorer/deposit/_hooks/useApprove.ts"

# Commit with message
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && git commit -m 'fix: remove debug logs'"

# Check status
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && git status"
```

### Package Management

```bash
# Install dependencies
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && npm install"

# Run scripts
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && npm run build"
```

### File Operations

```bash
# List files
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && ls -la"

# Check file contents
bash -c "cd /Users/son-yeongseong/Desktop/dev/tokamak-zkp-channel-manager-new && cat package.json"
```

## When to Use This

Use `bash -c` when:
- Running commands through Cursor's AI assistant terminal tool
- Encountering `_encode` or similar errors
- Commands fail with "command not found" errors
- Working in a sandboxed environment

## Alternative: Direct Terminal

If you have direct terminal access, you can run commands normally without `bash -c`:

```bash
cd /path/to/project
git add -A
git commit -m "message"
```

However, when using Cursor's AI assistant terminal tool, always use `bash -c` for reliability.

## Related Documentation

- [Cursor Commands Setup](./CURSOR_COMMANDS_SETUP.md) - Custom command configuration
- [Chrome Debug Setup](./CHROME_DEBUG_SETUP.md) - Terminal commands for Chrome debugging
- [MCP Browser Setup](./MCP_BROWSER_SETUP.md) - MCP server terminal commands
