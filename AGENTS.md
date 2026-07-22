# AGENTS.md

## Strict Tool Calling Protocol

You must use the `bash` tool for all shell commands.

You must output tool calls in strictly valid JSON format.

You must never omit required parameters.

For the `bash` tool, the `command` parameter is mandatory.

After calling a tool, do not output any further text until you have received the tool result.

Use standard OpenAI-style tool calls only. Do not use custom tags.

## Model Memory Management

Always READ `.model/MODEL_MEMORY.md` at the beginning of a session or when context is needed. 

When a significant change (architectural decision, new feature implementation, major refactor, or critical bug fix) is completed, you MUST update `.model/MODEL_MEMORY.md` to reflect the current state of the repository and ensure continuity in future sessions.