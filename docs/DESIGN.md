# PHINMA UI Event: interface direction

## Reference and scope

The supplied `design-reference-Design.html` board informs the sidebar, compact topbar, spacing, white cards on a quiet background, segmented filters, restrained status colors, and form organization. Its example application and domain data are not copied into PHINMA UI Event. The external sample AGENTS file informs the short instruction file and linked context documents only.

The product supports public discovery, one shared login, member identity, scoped council/faculty/staff submission, and administrator review. The existing CITE test organization is preserved. Reference-only pages such as scholarship hours, water reports, relief priority, duty applications, and example user-management screens do not become features.

## Shared visual system

- Brand action: PHINMA forest green `#006341`; hover `#004E35`.
- Accent: gold `#F4C62B`, used for the event mark rather than body text.
- University wordmarks use a yellow sun (`#F8CE00`) and green lettering (`#344B21`) on light surfaces; the home header uses the supplied white mark on deep green. Workspace marks retain their existing treatment. Browser tab icons use the owner-supplied college seal, fitted proportionally with transparency preserved.
- Public discovery canvas `#F6F7F3`, existing workspace canvas `#F4F6F2`, white surfaces, primary text `#1D3027`, secondary text `#58655B`.
- Headings: Bricolage Grotesque; body/UI: DM Sans, loaded through `next/font`.
- Main type: 32 px page title, 24–28 px section title, 18–21 px card title, 14–15 px body, 12–13 px metadata. Phone sizes adapt to available space.
- Shared 8/12 px control/card corners, 24 px working gaps, and visible focus states. Section/dialog entrances, card hover lift and link feedback respect reduced motion. No motion dependency; only the live-event dot loops, and countdown digits animate on value changes.

## Screens

| Screen | Primary question | Composition |
| --- | --- | --- |
| Public home | What events can I discover? | Full-width deep-green hero, white mark, arch campus photo, overlapping search, live strip, derived featured event, time pills and poster-first event grid |
| All events | What matches my interests? | Dedicated `/events` directory with department, course, organizer, year, search, and time filters |
| Event quick view / full details | What is this event? | Sticky zoomable poster beside facts/about/actions; calendar download, native sharing or copy fallback, and up to three related approved events. Native modal retains full-details link, nested poster zoom, Escape/focus return and scroll lock |
| Contact | How do I reach the university or publish an event? | Verified address/phone/email, Maps search link, university link and administrator/sign-in guidance; no contact backend |
| Shared login | How do I enter my account? | University image beside one form; on a phone, the form leads |
| Member account | What account and access do I have? | Shared sidebar, verified identity card, access explanation, event browsing action |
| Organizer | What am I submitting and how is it progressing? | One My events destination, Create event action, compact poster/status/schedule rows, status filters, on-demand editor and private live public-card/details previews |
| Administrator | Which submissions need a decision? | Real queue totals, pending submissions, review guidance, decision controls, reviewed history |

Pending, published, rejected, upcoming, ongoing, and past carry explicit words and icons. Color is supplemental. Counts are derived from available records, and unavailable data is not displayed as a confirmed zero. Poster display preserves the full image rather than clipping its text.

## Navigation and access

Public navigation stays compact. Signed-in users share a 248 px sidebar with only available event/account destinations. Phone workspaces use a navigation drawer and a bottom navigation row. Unsupported pages from the reference have no placeholder links.

Phone audience filters start collapsed to keep events visible. Show/Hide filters controls preserve selections and expose correct expanded state; desktop controls remain visible. Full-detail posters offer a separate zoom dialog with fit/original-size controls, keyboard close/focus management, and a scrollable image. Pre-submit previews show the selected local image and file metadata without uploading it.

Role visibility does not authorize data operations. Supabase policies and the review RPCs remain authoritative. Source imagery and ownership are documented in `IMAGE_SOURCES.md`; the design-reference file remains an owner-supplied local reference.

## October 2026 refresh and rejected revisions

The public home uses the campus photograph beside a forest-green field, a two-line headline, and a gold action. Workspaces use the Taste editorial-greeting direction with the existing PHINMA typography/palette preserved: a sage ground, neutral navigation selection, regular-weight counts, and a centered working column. The public landing headline is deliberately larger than workspace headings. The event board remains the live interaction; there are no invented events, metrics, testimonials, or extra product features.

The organizer’s primary task is preparing an event for review. A rejected card offers **Edit and resubmit**; its saved details, local Philippine times, current poster, and administrator note load into the existing form. The form offers **Cancel revision** and **Resubmit for review**. A pending card explicitly says it remains private until approved; a published card explicitly says editing is locked. The review guide explains Prepare, Review, and Publish. At narrow phone widths, time filters and result counts wrap instead of widening the page, and editable fields use 16px text.

The subsequent organizer redesign replaces the permanent form/history split with one My events overview. The original PHINMA fonts, sage surfaces and green/gold identity remain; the Taste accent-ladder sheet informs the flat list and restrained status signals. Its main question is “What needs attention in my submissions?” Rejection notes sit beside Edit and resubmit; the Create event action opens the editor above the list. The public-card preview sits beside the form on wide screens and stacks below on phones/tablets. The earlier static review guide is replaced by the actual event presentation. Every preview uses entered/saved data and carries an explicit private-preview note. Browser fixture screenshots use the existing campus photo only in intercepted data; no sample event is published.

Reusing the existing form and trusted review-RPC pattern keeps the workflow small. A separate editor route would duplicate the form; direct review-state updates would weaken the boundary. The resubmission RPC instead accepts only content and controls the pending reset itself. Existing poster-delete RLS protects linked images, so no wider Storage write policy is needed.

## Public campus experience

The owner's detailed 2026-10-26 brief defines the public design. Its external Claude artifact could not be accessed; no claim is made of matching uninspected pixels. The hero uses the existing campus photograph in a 280px arch with a two-line headline. Desktop search replaces the sidebar; course/organizer remain in a native More filters disclosure. Phones retain Show/Hide filters without resetting values. Cards contain the complete 4:3 poster, a gold Philippine day/month tile, publisher/audience/schedule, and a text/icon status chip. Workspace card behavior is unchanged.

Featured selection prefers an ongoing approved event with earliest end, otherwise the nearest upcoming approved event; none means no featured block. The live strip uses inclusive start/exclusive end boundaries. Countdown days/hours/minutes update through the existing 60-second clock; screen-reader messages change on the coarser day/hour/state boundary. No admin feature flag or persisted schedule category is introduced. Search filters affect the directory grid; live/featured sections describe the whole campus.

Details and quick view use the same complete announcement and actions. Calendar files escape text, fold UTF-8 lines at 75 octets, and export UTC timestamps with no location field. Share uses the native API, then clipboard, then a selectable URL if clipboard is denied. Related events prefer the same organizer, otherwise the department, exclude the current/unpublished record and show at most three. Metadata makes an anonymous, approved-only title/description request and never includes private fields or expiring poster URLs.

Motion uses CSS entrances, a one-time photo scale, hover/focus feedback, a sliding pill, dialog/backdrop entrance, and a one-shot IntersectionObserver hook. Results use a short native browser animation without remounting event cards, preserving modal return focus across refreshes. The live dot pulses; countdown digits animate only when their value changes. Reduced-motion settings remove movement, including when preferences change while open. Skeleton cards are static and labeled as loading; scroll-reveal content is visible before JS adds any pending state.

University contact facts were checked on 2026-10-26 against the [official university page](https://ui.phinma.edu.ph/about-us/) and [PHINMA corporate contact directory](https://www.phinma.com.ph/contact-us-2/). Both list Rizal Street in Iloilo City; neither lists La Paz. Use `Rizal Street, Iloilo City, Iloilo 5000, Philippines` in contact/footer, `(033) 338-1071 loc. 106`, and `info.ui@phinmaed.com` with a source/confirmation comment. The Maps URL is a search query, not invented coordinates or an event venue.

The owner then supplied the original [Khaos-s/Phinma-Event repository](https://github.com/Khaos-s/Phinma-Event). Its main tree, PHINMA home templates and older Flask templates were inspected. The [old contact prototype](https://github.com/Khaos-s/Phinma-Event/blob/main/old/New%20folder/not%20yet/contact.html) contains placeholder address text and personal contact examples, not a verified university street address. No La Paz address was found in the reviewed files. No legacy roster/account/credential or personal contact data was copied. Legacy administration/student-management examples do not supersede the accepted shared-calendar, single-administrator event approval model.

## Owner reference refresh — 26 October 2026

Full event details and their public/organizer/admin previews use a single-column layout at every width: the contained poster appears first, followed by the title, schedule, audience and description. Poster zoom remains available.

The owner's campus-screen image and Google Sites prototype inform visual composition. The home uses a compact centered crest/wordmark on forest green, a subtle authentic campus backdrop, a visible search field, and an audience-filter disclosure. Desktop discovery has four compact white poster-led cards per row, with gold calendar tiles and readable course/status labels; tablet and phone grids collapse. Full descriptions remain available in the full details/quick view. The spotlight uses a forest information panel and gold action/countdown; poster images remain contained. The forest footer groups campus navigation and verified university contact channels. Dark mode and reduced motion remain supported.

The organizer uses a centered white proposal form and a two-step indicator. Next opens a dedicated full-details preview; Back preserves the mounted form and image; final Submit requests administrator review. The public showcase mirrors these two visual steps using disabled form controls and no private records. The reference's simulated roles, example events, extra fields, and decisions on already reviewed events are not application behavior.

The navigation refresh separates public destinations into a second header row and keeps theme/account controls beside the university identity. Mobile navigation groups campus and account links with matching active states. Workspace sidebars group role-specific work and campus links, use the university sun mark, and keep account controls at the foot. Event details add local links to the information and related events below the poster. Both menus retain keyboard dismissal and mobile overflow handling.

## Full-screen homepage — 27 October 2026

The homepage hero fills the initial viewport below the closed public navigation, using the real campus photograph, a larger university identity, and the existing search/filter form. The footer of the hero links directly to the event board. Its minimum height follows the desktop/mobile header sizes; short screens and expanded audience filters grow naturally without clipping controls. The event directory and protected workspaces retain their existing layouts. Existing motion and reduced-motion preferences apply.

The public navigation header displays only the university logo, with its accessible home-link label preserved. The repeated text wordmark and divider beside it are removed; the homepage hero retains the large platform title.

## Single-row navigation correction — 27 October 2026

The public header combines the university logo, primary page links, theme control and account actions in one 72px row, plus its 5px borders. The previous second navigation row is removed. At widths of 1100px and below, links and account actions move into the existing menu; the logo, theme control and menu toggle remain in one row. The full-screen homepage and anchor offsets follow the reduced header height.

The homepage header overlays the campus photograph with a transparent background, white logo/links and gold account action. It returns to the theme’s solid surface after scrolling 24px or opening the mobile menu. The hero includes the header in its full viewport height; the sticky header, other public pages and workspace navigation keep their existing behavior. Scroll state uses the same hydration-safe external-store pattern as the theme control.

## Page motion and focused sign-in — 27 October 2026

Every application page uses a 260ms opacity entrance on its existing content, without translating the whole screen or remounting forms. On the homepage, only the hero content fades so the photograph stays opaque beneath the transparent navigation. Pointer presses use a short scale response; keyboard focus and reduced-motion users receive immediate controls. Existing poster/dialog, loading, hero and scroll-reveal feedback remains. Repeated workspace data refreshes do not replay the page entrance. The login image/story panel is removed, leaving a centered single-column sign-in card with existing authentication, recovery, validation and account guidance.
