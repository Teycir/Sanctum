# Error Handling Rules

## No Silent Error Suppression

**CRITICAL**: Never use empty catch blocks or catch blocks that silently hide errors.

### ❌ FORBIDDEN:

```typescript
try {
  // code
} catch (error) {
  // Empty - silently hides error
}

try {
  // code
} catch (error) {
  return false; // Silently hides error
}

try {
  // code
} catch (_error) {
  // Underscore prefix doesn't make it acceptable
}
```

### ✅ REQUIRED:

```typescript
try {
  // code
} catch (error) {
  // Check for expected error types
  if (error instanceof TypeError) {
    return false;
  }
  // Re-throw unexpected errors
  throw error;
}

try {
  // code
} catch (error) {
  // Log and handle appropriately
  logger.error('Operation failed', error);
  throw new Error('Specific error message', { cause: error });
}
```

### Rules:

1. **Always handle errors explicitly** - Check error type and handle expected errors only
2. **Re-throw unexpected errors** - Never silently suppress errors you don't understand
3. **No bare catch blocks** - Every catch must have meaningful error handling
4. **No underscore-prefixed unused errors** - If you catch it, handle it properly
5. **Log critical errors** - Use proper logging for debugging and monitoring

### Exceptions:

Only acceptable when:
- Error type is explicitly checked (e.g., `error instanceof TypeError`)
- Unexpected errors are re-thrown
- Error is logged with context before returning fallback value
