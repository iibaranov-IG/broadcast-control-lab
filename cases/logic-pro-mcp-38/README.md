# Restore Logic Pro mixer mutations

Case for https://github.com/koltyj/logic-pro-mcp/issues/38.

The public mixer tool accepts `track` and `value`, but the original dispatcher and backends use mutually incompatible parameter names. Volume, pan, and master volume therefore exhaust every route. The repair keeps one contract across layers and implements master fader mutation through the already proven Accessibility mixer tree.
