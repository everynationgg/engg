# UI Standards & Mobile Compliance

To maintain a premium, responsive experience across all games on [engg.online](https://www.engg.online), follow these standards for all new frontend components.

## AI Audit Prompt

When adding new UI components or auditing existing ones, use this prompt to ensure mobile compliance:

> "Scan all new UI components for mobile compliance.
>
> 1. **Check for Fixed Widths**: Flag any `px` widths and replace with `max-w-full` or percentages.
> 2. **Audit Text Handling**: Ensure all dynamic strings or underscored constants use `break-words` or `truncate`.
> 3. **Flex-Wrap Check**: Ensure all flex containers on mobile use `flex-wrap` or switch to `flex-col`.
> 4. **Safe Area Insets**: Verify that buttons aren't too close to the screen edges or overlapping the mobile browser navigation bar."

## Design Principles

1. **Fluid Containers**: Always prioritize `w-full` with `max-w-screen-*` over fixed pixel widths.
2. **Typography Resilience**: Assume labels can be long. Use `break-all` for technical identifiers and `truncate` for user-generated content.
3. **Touch Targets**: Interactive elements must have a minimum hit area of 44x44px and sufficient spacing to prevent accidental clicks.
4. **Viewport Awareness**: Use `vh` and `vw` sparingly for layouts; prefer flex/grid that adapts to the content and `min-h-screen`.
