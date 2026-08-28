```markdown
# Razchly Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides guidance on the development patterns and conventions used in the Razchly TypeScript codebase. It covers file organization, code style, commit practices, and testing patterns to ensure consistency and maintainability. While no specific framework is used, the repository follows clear conventions for naming, imports, exports, and commit messages.

## Coding Conventions

### File Naming
- **Style:** Snake case
- **Example:**  
  ```plaintext
  user_profile.ts
  data_processor.test.ts
  ```

### Import Style
- **Relative imports are used.**
- **Example:**  
  ```typescript
  import { processData } from './data_processor';
  ```

### Export Style
- **Named exports are preferred.**
- **Example:**  
  ```typescript
  // In user_profile.ts
  export function getUserProfile(id: string) { ... }
  ```

### Commit Messages
- **Conventional commit format with `feat` prefix.**
- **Example:**  
  ```
  feat: add user profile retrieval function
  ```

## Workflows

### Creating a New Feature
**Trigger:** When adding a new functionality or module  
**Command:** `/new-feature`

1. Create a new file using snake_case naming (e.g., `new_feature.ts`).
2. Use relative imports to include dependencies.
3. Export functions or constants using named exports.
4. Write a test file named `new_feature.test.ts` alongside the implementation.
5. Commit changes with a message like:  
   ```
   feat: implement new feature for X
   ```

### Writing Tests
**Trigger:** When adding or updating functionality  
**Command:** `/write-test`

1. Create a test file with the `.test.ts` suffix (e.g., `data_processor.test.ts`).
2. Place test files in the same directory as the code or in a dedicated `tests` folder.
3. Follow the repository's code style for imports and exports.
4. Run tests using the project's preferred test runner (framework not specified).

## Testing Patterns

- **Test files follow the `*.test.ts` naming convention.**
- **Testing framework is not specified; use common TypeScript test runners (e.g., Jest, Mocha) as appropriate.**
- **Example test file:**
  ```typescript
  // data_processor.test.ts
  import { processData } from './data_processor';

  describe('processData', () => {
    it('should process data correctly', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                 |
|----------------|-----------------------------------------|
| /new-feature   | Scaffold and commit a new feature/module|
| /write-test    | Create and run tests for a module       |
```
