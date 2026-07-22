# AGENTS.md

## Strict Tool Calling Protocol

You must use the `bash` tool for all shell commands.

You must use bash directly . do not use custom <tool_call> to do bash commands. You should never do custom tool_call unless asked to do so

You must output tool calls in strictly valid JSON format.

You must never omit required parameters.

For the `bash` tool, the `command` parameter is mandatory.

You must use bash directly . do not use custom <tool_call> to do bash commands. You should never do custom tool_call unless asked to do so

After calling a tool, do not output any further text until you have received the tool result.

Use standard OpenAI-style tool calls only. Do not use custom tags.

## Model Memory Management

Always READ `.model/MODEL_MEMORY.md` at the beginning of a session or when context is needed. 

When a significant change (architectural decision, new feature implementation, major refactor, or critical bug fix) is completed, you MUST update `.model/MODEL_MEMORY.md` to reflect the current state of the repository and ensure continuity in future sessions.


## Good Coding practices ( Always Follow unless asked not to do)
Always add a comment before a function explaining what that fuction does in 1-3 lines so its easier for others to understand
