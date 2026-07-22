# AGENTS.md

## Strict Tool Calling Protocol

You must use the `bash` tool for all shell commands.

You must output tool calls in strictly valid JSON format.

You must never omit required parameters.

For the `bash` tool, the `command` parameter is mandatory.

After calling a tool, do not output any further text until you have received the tool result.

Use standard OpenAI-style tool calls only. Do not use custom tags.

## Strict Format Rules

Do not use custom tags like `<|tool_call|>`.

Always use standard OpenAI function calling format.

If you need to run a complex bash command, write it to a file first using the `write` tool, then execute the file using the `bash` tool.

Never output raw bash strings that are longer than one line inside the `bash` tool; use a script file instead.