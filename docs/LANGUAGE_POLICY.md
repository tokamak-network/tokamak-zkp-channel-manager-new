# Language Policy

## Overview

All documentation, code comments, and inline explanations in this project must be written in **English only**.

## Scope

This policy applies to:

- ✅ Code comments (single-line and multi-line)
- ✅ Documentation files (`.md` files)
- ✅ Inline code explanations
- ✅ Function and class docstrings
- ✅ API documentation
- ✅ README files
- ✅ Error messages (user-facing)
- ✅ Commit messages
- ✅ Pull request descriptions

## Rationale

- **Consistency**: Ensures all team members can understand the codebase regardless of their native language
- **International Collaboration**: Facilitates collaboration with international developers
- **Industry Standard**: English is the standard language for software development
- **Tool Compatibility**: Many development tools and linters expect English comments

## Guidelines

### Code Comments

```typescript
// ✅ Good: English comment
// Initialize database connection
const db = await initDb();

// ❌ Bad: Non-English comment
// 데이터베이스 연결 초기화
const db = await initDb();
```

### Documentation

```markdown
<!-- ✅ Good: English documentation -->
## Database Module

The database module provides a unified interface for data persistence.

<!-- ❌ Bad: Non-English documentation -->
## 데이터베이스 모듈

데이터 영속성을 위한 통합 인터페이스를 제공합니다.
```

### Function Documentation

```typescript
/**
 * ✅ Good: English documentation
 * Saves channel information to the database
 * @param channelId - The unique identifier for the channel
 * @param channelData - The channel data to save
 */
export async function saveChannel(
  channelId: string,
  channelData: Partial<Channel>
): Promise<void> {
  // ...
}
```

## Exceptions

The following are **exceptions** to this policy:

- **Variable names**: Can use domain-specific terms (e.g., Korean business terms in variable names if they are part of the domain)
- **String literals for display**: User-facing UI text can be in the target language
- **Test data**: Test fixtures and sample data can use any language if it's part of the test scenario

## Enforcement

- Code reviews should check for compliance with this policy
- Linters can be configured to flag non-English comments (if available)
- Team members should remind each other to follow this policy

## Migration

For existing code with non-English comments:

1. **New code**: Must follow English-only policy
2. **Modified code**: Update comments to English when touching the code
3. **Legacy code**: Gradually migrate to English during refactoring

## Questions?

If you have questions about this policy or need clarification, please discuss with the team lead or create an issue.

---

**Last Updated**: 2026-01-08
