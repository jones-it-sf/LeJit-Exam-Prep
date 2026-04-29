Design System
Aesthetic Direction
Clerk / stripe.dev / Harvey style. Refined, minimal, confident. Every pixel is intentional. If it looks like "an AI made this," it's wrong.
Color Palette
Stone (Tailwind) — warm neutrals, not cold grays.
    •    stone-950 (#0c0a09) — foreground text
    •    stone-500 (#78716c) — muted/secondary text
    •    stone-400 (#a8a29e) — tertiary/placeholder
    •    stone-300 (#d6d3d1) — borders (light mode)
    •    stone-200 (#e7e5e4) — lighter borders
    •    stone-100 (#f5f5f4) — hover states
    •    stone-50 (#fafaf9) — content background
    •    #f7f7f7 — app background (light mode)
    •    #191919 — app background (dark mode)
Why: Warm stone tones feel premium and human. Cold grays (zinc, slate) feel generic and AI-generated.
Typography
    •    Font: Geist
    •    Body text: 13px — the baseline for all UI text
    •    Labels: 12-13px, font-medium
    •    Headings: 14px font-semibold (section), never larger than 22px
    •    Uppercase labels: 11-12px, tracking-[0.05em-0.08em], only for tiny section headers
    •    Sentence case everywhere — "Knowledge base" not "Knowledge Base"
Why: Consistent sizing prevents visual noise. Sentence case feels modern and approachable.
Layout
    •    Floating content card: rounded-[2px] border border-[var(--border)] bg-[var(--bg-content)] inside a p-2 outer shell with bg-[#f7f7f7]
    •    Header nav: top bar with logo + nav items + user menu, not sidebar
    •    Page sub-header: centered breadcrumbs with frosted glass backdrop-blur, px-2 padding, actions on the right
    •    Content max-width: max-w-[1480px] for tables, max-w-3xl for forms
    •    Spacing between form sections: space-y-8 — never use <Separator /> lines
Why: The floating card creates depth. Separators create visual noise — whitespace is the separator.
Components
Buttons
    •    Active nav / primary actions: btn-bevel-base btn-bevel-default — top light source bevel effect
    •    Secondary: variant="outline" or variant="ghost"
    •    Sizing: size="sm" for most actions
Toggle/Switch
    •    Use size="sm" for inline toggles
    •    Override orange checked state: data-[state=checked]:border-[var(--cr-color-neutral-800)] data-[state=checked]:bg-[var(--cr-color-neutral-800)]
    •    Never use the default orange toggle — it clashes with the stone palette
Checkboxes
    •    accent-[var(--fg)] on native checkboxes
    •    Wrap in rows with px-3 py-2.5 padding, hover state hover:bg-[var(--cr-color-neutral-50)]
    •    Separate rows with border-b not spacing
Tables
    •    Sortable column headers with caret indicators
    •    Row hover + cursor-pointer for clickable rows
    •    Overflow content: show 2 items max + "+N" with tooltip for the rest
    •    Actions column: right-aligned ellipsis dropdown menu (DotsThree icon), not inline buttons
    •    Default/pinned rows: sticky top-0 with subtle bg-[var(--cr-color-neutral-50)]
Empty States
    •    AnimatedEmptyState with Unicorn Studio background
    •    rounded-[6px] border, overflow-hidden
    •    Light mode: 10% opacity background. Dark mode: 30%
    •    Icon: neutral-500 light / neutral-400 dark
    •    Description: same neutral tones
    •    Always render outside tables (not as a table row)
Drawers/Sheets
    •    Header: border-bottom, px-6 py-4
    •    Content: overflow-y-auto px-6 py-5
    •    Footer: outside scroll container, sticky to bottom, border-top
    •    Use Tabs component (pill variant) for mode switching, not custom toggle buttons
Cards
    •    rounded-[6px] — the standard card radius
    •    Borders: border-[var(--cr-color-neutral-200)] dark:border-[var(--cr-color-neutral-800)]
    •    Never rounded-[10px] or rounded-[14px] — those are over-rounded
Links
    •    Stone palette colors, not blue: text-[var(--cr-color-neutral-500)] hover:text-[var(--fg)]
    •    Or text-[var(--fg)] hover:underline for prominent links
Anti-Patterns (NEVER DO)
Visual
    •    No orange toggles — override to neutral
    •    No blue links in the stone palette — use stone colors
    •    No <Separator /> between form sections — use spacing
    •    No dot grids or decorative backgrounds on content areas
    •    No left border accent bars for nav active state — use bg + font-weight
    •    No rounded-[10px]+ on cards — max rounded-[6px]
    •    No box-shadow on content bordered areas — hard border only
Layout
    •    No redundant headings — if the page sub-header shows the title, don't repeat it in the content
    •    No "Default Scope" special cards — treat it as a pinned table row with a badge
    •    No full-width banners for settings — use an inline card above the form
    •    No sidebar for 5 nav items — header nav is sufficient
Icons
    •    Phosphor Icons (@phosphor-icons/react/dist/ssr) with weight="fill"
    •    Size: size-4 (16px) for nav and inline, size-8 for empty states
    •    CodeRabbit logo: black in light mode, white in dark mode (separate SVG files, not CSS filter)
Forms
    •    Consistent grid layout: sm:grid-cols-[180px_1fr] for label + field
    •    All fields same grid — don't mix stacked and grid layouts
    •    Labels: pt-2.5 text-[13px]
    •    Credential rows: stack vertically in bordered cards, X icon to remove (not "Remove" text)
How to Apply
Before writing any UI code, check this document. When in doubt, look at Clerk's dashboard or stripe.dev for reference. The goal is: if someone saw this UI, they would NOT guess an AI built it.
Design System — CodeRabbit Slack Bot UI
Aesthetic Direction
Clerk / stripe.dev / Harvey style. Refined, minimal, confident. Every pixel is intentional. If it looks like "an AI made this," it's wrong.
Color Palette
Stone (Tailwind) — warm neutrals, not cold grays.
    •    stone-950 (#0c0a09) — foreground text
    •    stone-500 (#78716c) — muted/secondary text
    •    stone-400 (#a8a29e) — tertiary/placeholder
    •    stone-300 (#d6d3d1) — borders (light mode)
    •    stone-200 (#e7e5e4) — lighter borders
    •    stone-100 (#f5f5f4) — hover states
    •    stone-50 (#fafaf9) — content background
    •    #f7f7f7 — app background (light mode)
    •    #191919 — app background (dark mode)
Why: Warm stone tones feel premium and human. Cold grays (zinc, slate) feel generic and AI-generated.
Typography
    •    Font: Geist
    •    Body text: 13px — the baseline for all UI text
    •    Labels: 12-13px, font-medium
    •    Headings: 14px font-semibold (section), never larger than 22px
    •    Uppercase labels: 11-12px, tracking-[0.05em-0.08em], only for tiny section headers
    •    Sentence case everywhere — "Knowledge base" not "Knowledge Base"
Why: Consistent sizing prevents visual noise. Sentence case feels modern and approachable.
Layout
    •    Floating content card: rounded-[2px] border border-[var(--border)] bg-[var(--bg-content)] inside a p-2 outer shell with bg-[#f7f7f7]
    •    Header nav: top bar with logo + nav items + user menu, not sidebar
    •    Page sub-header: centered breadcrumbs with frosted glass backdrop-blur, px-2 padding, actions on the right
    •    Content max-width: max-w-[1480px] for tables, max-w-3xl for forms
    •    Spacing between form sections: space-y-8 — never use <Separator /> lines
Why: The floating card creates depth. Separators create visual noise — whitespace is the separator.
Components
Buttons
    •    Active nav / primary actions: btn-bevel-base btn-bevel-default — top light source bevel effect
    •    Secondary: variant="outline" or variant="ghost"
    •    Sizing: size="sm" for most actions
Toggle/Switch
    •    Use size="sm" for inline toggles
    •    Override orange checked state: data-[state=checked]:border-[var(--cr-color-neutral-800)] data-[state=checked]:bg-[var(--cr-color-neutral-800)]
    •    Never use the default orange toggle — it clashes with the stone palette
Checkboxes
    •    accent-[var(--fg)] on native checkboxes
    •    Wrap in rows with px-3 py-2.5 padding, hover state hover:bg-[var(--cr-color-neutral-50)]
    •    Separate rows with border-b not spacing
Tables
    •    Sortable column headers with caret indicators
    •    Row hover + cursor-pointer for clickable rows
    •    Overflow content: show 2 items max + "+N" with tooltip for the rest
    •    Actions column: right-aligned ellipsis dropdown menu (DotsThree icon), not inline buttons
    •    Default/pinned rows: sticky top-0 with subtle bg-[var(--cr-color-neutral-50)]
Empty States
    •    AnimatedEmptyState with Unicorn Studio background
    •    rounded-[6px] border, overflow-hidden
    •    Light mode: 10% opacity background. Dark mode: 30%
    •    Icon: neutral-500 light / neutral-400 dark
    •    Description: same neutral tones
    •    Always render outside tables (not as a table row)
Drawers/Sheets
    •    Header: border-bottom, px-6 py-4
    •    Content: overflow-y-auto px-6 py-5
    •    Footer: outside scroll container, sticky to bottom, border-top
    •    Use Tabs component (pill variant) for mode switching, not custom toggle buttons
Cards
    •    rounded-[6px] — the standard card radius
    •    Borders: border-[var(--cr-color-neutral-200)] dark:border-[var(--cr-color-neutral-800)]
    •    Never rounded-[10px] or rounded-[14px] — those are over-rounded
Links
    •    Stone palette colors, not blue: text-[var(--cr-color-neutral-500)] hover:text-[var(--fg)]
    •    Or text-[var(--fg)] hover:underline for prominent links
Anti-Patterns (NEVER DO)
Visual
    •    No orange toggles — override to neutral
    •    No blue links in the stone palette — use stone colors
    •    No <Separator /> between form sections — use spacing
    •    No dot grids or decorative backgrounds on content areas
    •    No left border accent bars for nav active state — use bg + font-weight
    •    No rounded-[10px]+ on cards — max rounded-[6px]
    •    No box-shadow on content bordered areas — hard border only
Layout
    •    No redundant headings — if the page sub-header shows the title, don't repeat it in the content
    •    No "Default Scope" special cards — treat it as a pinned table row with a badge
    •    No full-width banners for settings — use an inline card above the form
    •    No sidebar for 5 nav items — header nav is sufficient
Icons
    •    Phosphor Icons (@phosphor-icons/react/dist/ssr) with weight="fill"
    •    Size: size-4 (16px) for nav and inline, size-8 for empty states
    •    CodeRabbit logo: black in light mode, white in dark mode (separate SVG files, not CSS filter)
Forms
    •    Consistent grid layout: sm:grid-cols-[180px_1fr] for label + field
    •    All fields same grid — don't mix stacked and grid layouts
    •    Labels: pt-2.5 text-[13px]
    •    Credential rows: stack vertically in bordered cards, X icon to remove (not "Remove" text)