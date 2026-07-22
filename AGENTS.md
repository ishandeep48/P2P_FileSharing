# AGENTS.md

# ============================================================================
# Tool Usage
# ============================================================================

## Strict Tool Calling Protocol

DO NOT USE TOOL CALL ONLY USE BASH FOR WRITE ,READ, EDIT AND OTHER STUFFS . TOOL CALL FAILS AND YOU END UP WITH EFFORT THAT DONT DO ANYTHING
- Use the `bash` tool for all shell commands.
- Use the standard OpenAI tool-calling format.
- Never use custom `<tool_call>` tags unless explicitly requested.
- Wait for tool results before continuing.
- Do not do bash from `<tool_call>` use bash directly

# ============================================================================
# Repository Memory
# ============================================================================

## Model Memory

At the beginning of a session, read:

.model/MODEL_MEMORY.md

This file contains important architectural decisions and repository knowledge.

Whenever any of the following occur, update `.model/MODEL_MEMORY.md`:

- New feature
- Major refactor
- Architecture change
- New dependency
- Critical bug fix
- Database/schema changes
- Significant folder structure changes

The memory file should always reflect the current repository.

# ============================================================================
# Engineering Principles
# ============================================================================

Always prioritize:

1. Correctness
2. Readability
3. Maintainability
4. Simplicity
5. Performance

Prefer:

- SOLID
- DRY
- KISS
- YAGNI

Avoid unnecessary abstractions and premature optimization.

# ============================================================================
# Before Coding
# ============================================================================

Before implementing any feature:

- Understand the existing architecture.
- Search the repository for similar implementations.
- Reuse existing code whenever possible.
- Think through the implementation before writing code.
- Consider edge cases.
- Ask for clarification if requirements are ambiguous.

Briefly explain the implementation plan before making changes.

# ============================================================================
# Implementation Rules
# ============================================================================

While implementing:

- Make the smallest change that solves the problem.
- Preserve existing behavior unless explicitly requested.
- Avoid duplicate logic.
- Keep functions focused on one responsibility.
- Use meaningful variable and function names.
- Prefer composition over duplication.
- Keep code modular.
- Follow existing project conventions.

Do not rewrite large sections of the project unless explicitly requested.

# ============================================================================
# Frontend Guidelines
# ============================================================================

For frontend code:

- Keep state as local as possible.
- Avoid unnecessary prop drilling.
- Prefer reusable components.
- Avoid unnecessary re-renders.
- Handle loading states.
- Handle empty states.
- Handle error states.
- Write semantic HTML.
- Build accessible components.
- Keep components focused on a single responsibility.

# ============================================================================
# Backend Guidelines
# ============================================================================

For backend code:

- Validate all external input.
- Never trust client data.
- Handle errors explicitly.
- Write secure defaults.
- Design consistent APIs.
- Separate business logic from routing.
- Avoid duplicated validation.
- Consider scalability and maintainability.

# ============================================================================
# Refactoring
# ============================================================================

When refactoring:

- Preserve behavior.
- Improve readability first.
- Improve naming.
- Reduce duplication.
- Extract reusable code only when beneficial.
- Explain why each refactor improves the codebase.

Prefer incremental refactoring over rewriting entire files.

# ============================================================================
# Minimal Changes Policy
# ============================================================================

When modifying existing code:

- Prefer the smallest possible change that solves the problem.
- Edit only the affected functions, components, or modules.
- Do not rewrite an entire file when only a small section needs modification.
- Preserve existing formatting and coding style where reasonable.
- Reuse existing code instead of replacing it.
- Avoid moving code unless it improves maintainability.

When multiple approaches are possible, prefer the one that results in the smallest readable diff.

Only rewrite an entire file if:
- The user explicitly requests it.
- The existing implementation is fundamentally broken.
- A major architectural refactor has been requested.


When editing an existing file, identify the smallest affected section and modify only that section instead of regenerating the entire file whenever possible.

# ============================================================================
# Large Files
# ============================================================================

When working with large files:

- Read enough surrounding context before making changes.
- Modify only the necessary sections.
- Do not regenerate unchanged code.
- Do not duplicate existing code.
- Preserve comments and formatting unless they need improvement.



# ============================================================================
# Debugging
# ============================================================================

When debugging:

- Identify the root cause.
- Do not treat symptoms.
- Explain the cause before proposing a fix.
- Consider edge cases.
- Verify that the fix does not introduce regressions.

# ============================================================================
# Code Reviews
# ============================================================================

When reviewing code, always check for:

- Bugs
- Logic errors
- Edge cases
- Performance issues
- Security issues
- Maintainability
- Readability
- Architecture
- React best practices
- Backend best practices

Explain why each issue matters.

Rank issues by severity.

# ============================================================================
# Documentation
# ============================================================================

Write self-documenting code.

Use comments only when they add value.

Document:

- Complex algorithms
- Public APIs
- Non-obvious business logic
- Important architectural decisions

Avoid comments that merely restate the code.

# ============================================================================
# Communication
# ============================================================================

Be concise.

Recommend the best solution when multiple options exist.

Explain trade-offs.

Do not guess.

If uncertain, explicitly say so.

Challenge incorrect assumptions with technical reasoning.

# ============================================================================
# Before Finishing
# ============================================================================

Before completing any task, perform a self-review.

Verify:

- Correctness
- Readability
- Maintainability
- Performance
- Security
- Edge cases

Fix obvious issues before presenting the final result.