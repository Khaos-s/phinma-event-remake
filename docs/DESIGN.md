# PHINMA UI Event: interface direction

## Reference and scope

The supplied `design-reference-Design.html` board informs the sidebar, compact topbar, spacing, white cards on a quiet background, segmented filters, restrained status colors, and form organization. Its example application and domain data are not copied into PHINMA UI Event. The external sample AGENTS file informs the short instruction file and linked context documents only.

The product supports public discovery, one shared login, member identity, scoped council/faculty/staff submission, and administrator review. The existing CITE test organization is preserved. Reference-only pages such as scholarship hours, water reports, relief priority, duty applications, and example user-management screens do not become features.

## Shared visual system

- Brand action: PHINMA forest green `#006341`; hover `#004E35`.
- Accent: gold `#F4C62B`, used for the event mark rather than body text.
- University wordmarks use a yellow sun (`#F8CE00`) and green lettering (`#344B21`) following the owner's supplied reference. The public header and workspace share this treatment. Browser tab icons use the owner-supplied college seal, fitted proportionally with transparency preserved.
- Canvas `#F6F7F3`, white surfaces, primary text `#1D3027`, secondary text `#58655B`.
- Headings: Bricolage Grotesque; body/UI: DM Sans, loaded through `next/font`.
- Main type: 32 px page title, 24–28 px section title, 18–21 px card title, 14–15 px body, 12–13 px metadata. Phone sizes adapt to available space.
- Shared 8/12 px control/card corners, 24 px working gaps, and visible focus states. Motion is limited to interaction feedback and respects reduced motion.

## Screens

| Screen | Primary question | Composition |
| --- | --- | --- |
| Public home | What events can I discover? | Compact campus photo header, neutral audience/search filters, time tabs, clickable event cards, and an all-events link |
| All events | What matches my interests? | Dedicated `/events` directory with department, course, organizer, year, search, and time filters |
| Event quick view / full details | What is this event? | Native modal preview with full-details link; shareable `/events/[id]` announcement with complete poster, schedule, department, course, year, and description |
| Shared login | How do I enter my account? | University image beside one form; on a phone, the form leads |
| Member account | What account and access do I have? | Shared sidebar, verified identity card, access explanation, event browsing action |
| Organizer | What am I submitting and how is it progressing? | Assigned organization and department, valid course choices, own status counts, local poster preview, submission history and review notes |
| Administrator | Which submissions need a decision? | Real queue totals, pending submissions, review guidance, decision controls, reviewed history |

Pending, published, rejected, upcoming, ongoing, and past carry explicit words and icons. Color is supplemental. Counts are derived from available records, and unavailable data is not displayed as a confirmed zero. Poster display preserves the full image rather than clipping its text.

## Navigation and access

Public navigation stays compact. Signed-in users share a 248 px sidebar with only available event/account destinations. Phone workspaces use a navigation drawer and a bottom navigation row. Unsupported pages from the reference have no placeholder links.

Phone audience filters start collapsed to keep events visible. Show/Hide filters controls preserve selections and expose correct expanded state; desktop controls remain visible. Full-detail posters offer a separate zoom dialog with fit/original-size controls, keyboard close/focus management, and a scrollable image. Pre-submit previews show the selected local image and file metadata without uploading it.

Role visibility does not authorize data operations. Supabase policies and the review RPCs remain authoritative. Source imagery and ownership are documented in `IMAGE_SOURCES.md`; the design-reference file remains an owner-supplied local reference.
