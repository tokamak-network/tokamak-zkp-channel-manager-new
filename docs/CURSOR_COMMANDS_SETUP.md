# Cursor Custom Commands Setup Guide

This guide explains how to set up custom commands in Cursor that reference project documentation files.

## Overview

Cursor allows you to create custom commands that can reference specific documentation files. This is useful for:
- Quick access to coding standards and policies
- Consistent reference to project guidelines
- Easy integration of documentation into your workflow

## Setup Instructions

### Step 1: Open Cursor Settings

1. Open Cursor
2. Go to **Settings** → **Cursor Settings** (or press `Cmd+,` on Mac / `Ctrl+,` on Windows/Linux)
3. Navigate to **Features** → **Custom Commands** (or search for "custom commands")

### Step 2: Create a New Custom Command

1. Click **"Add Custom Command"** or the **"+"** button
2. Fill in the command configuration:

#### Example: Language Policy Reference Command

**Command Name**: `@language-policy` or `@lang-policy`

**Command Description**: 
```
Reference the language policy documentation for code comments and documentation standards.
```

**Command Prompt**:
```
Please refer to the language policy document at docs/LANGUAGE_POLICY.md and ensure all code comments, documentation, and inline explanations follow the English-only policy. When writing or reviewing code, apply the guidelines from this document.
```

**Context Files** (optional but recommended):
- `docs/LANGUAGE_POLICY.md`

**Additional Settings**:
- **Auto-apply**: Leave unchecked (you want to review changes)
- **Show in Command Palette**: Checked (so you can search for it)

### Step 3: Alternative - Using Command Palette

You can also create commands via the Command Palette:

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "Cursor: Add Custom Command"
3. Follow the same configuration steps

## Recommended Commands

### 1. Language Policy Command

**Name**: `@lang-policy`

**Prompt**:
```
Reference docs/LANGUAGE_POLICY.md. All code comments, documentation, and inline explanations must be in English only. Apply the guidelines from this document when writing or reviewing code.
```

**Use Case**: When you need to ensure code follows the English-only policy.

### 2. Formatting Rules Command

**Name**: `@formatting`

**Prompt**:
```
Reference docs/TEAM_FORMATTING_RULES.md. Apply the team's formatting standards: 120 character line width, compact code style, and information density principle.
```

**Use Case**: When you need to format code according to team standards.

### 3. Synthesizer Documentation Command

**Name**: `@synthesizer-docs`

**Prompt**:
```
Reference the Synthesizer documentation at https://tokamak.notion.site/Synthesizer-documentation-164d96a400a3808db0f0f636e20fca24 and the rules in .cursorrules. When working with synthesizer code, follow the architecture and design patterns described in the documentation.
```

**Use Case**: When working with synthesizer-related code.

### 4. Verifier Reference Command

**Name**: `@verifier`

**Prompt**:
```
Reference .cursorrules section on Verifier Implementation References. When debugging or implementing verifier functionality, refer to the three implementations: Native Rust (verify-rust), WASM Rust (verify-wasm), and Solidity verifier. Ensure consistency across all implementations.
```

**Use Case**: When working with verifier code.

## Usage Examples

### Using Commands in Chat

Once configured, you can use these commands in Cursor's chat interface:

```
@lang-policy Please review this code and ensure all comments are in English
```

```
@formatting Format this code according to team standards
```

```
@verifier Help me debug this verification issue
```

### Using Commands in Code Context

You can also reference commands when selecting code:

1. Select code in the editor
2. Open Cursor chat
3. Type `@lang-policy` followed by your request
4. The command will apply the language policy guidelines to your selected code

## Advanced Configuration

### Using Multiple Document References

For commands that need to reference multiple documents:

**Prompt Example**:
```
Reference the following documents:
- docs/LANGUAGE_POLICY.md for language standards
- docs/TEAM_FORMATTING_RULES.md for formatting rules
- .cursorrules for project-specific coding standards

Apply all relevant guidelines when reviewing or writing code.
```

### Dynamic Document References

You can create commands that reference documents based on file type:

**Example for TypeScript files**:
```
When working with TypeScript files, reference:
- docs/LANGUAGE_POLICY.md for comment language
- docs/TEAM_FORMATTING_RULES.md for code style
- .cursorrules for TypeScript-specific rules

Ensure the code follows all applicable standards.
```

## Command Naming Conventions

Use consistent naming for easy discovery:

- `@lang-policy` - Language policy
- `@formatting` - Formatting rules
- `@synthesizer` - Synthesizer documentation
- `@verifier` - Verifier implementation
- `@docs-<name>` - General documentation reference

## Troubleshooting

### Command Not Appearing

1. Check that the command is enabled in settings
2. Verify the command name doesn't conflict with built-in commands
3. Restart Cursor after creating commands

### Document Not Found

1. Verify the document path is correct relative to the workspace root
2. Check that the document exists in the `docs/` directory
3. Use absolute paths if relative paths don't work

### Command Not Applying Guidelines

1. Ensure the prompt clearly references the document
2. Include specific instructions in the prompt
3. Test with a simple example first

## Best Practices

1. **Keep prompts specific**: Reference exact document paths and sections
2. **Use consistent naming**: Follow the `@<short-name>` convention
3. **Document your commands**: Keep a list of custom commands in this file
4. **Update regularly**: Keep commands in sync with documentation changes
5. **Test commands**: Verify commands work as expected before sharing

## Sharing Commands with Team

To share custom commands with your team:

1. Document commands in this file
2. Include setup instructions in project README
3. Consider version-controlling command configurations (if Cursor supports export)

## Example: Complete Command Configuration

Here's a complete example for the language policy command:

```json
{
  "name": "@lang-policy",
  "description": "Reference language policy for English-only code comments",
  "prompt": "Reference docs/LANGUAGE_POLICY.md. All code comments, documentation, and inline explanations must be in English only. When writing or reviewing code, ensure:\n- All inline comments are in English\n- Documentation follows English-only policy\n- Error messages use English\n- Commit messages are in English\n\nApply the guidelines from docs/LANGUAGE_POLICY.md.",
  "contextFiles": [
    "docs/LANGUAGE_POLICY.md",
    ".cursorrules"
  ],
  "enabled": true
}
```

## Next Steps

1. Set up the recommended commands above
2. Test each command with sample code
3. Customize commands for your specific workflow
4. Share successful command configurations with the team

---

**Note**: Cursor's custom command interface may vary by version. If the steps above don't match your version, refer to Cursor's official documentation or use the Command Palette to search for "custom commands".
