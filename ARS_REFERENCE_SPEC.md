# ARS Reference Specification

Status: inspected from the two image attachments supplied in the conversation on 2026-10-23. The attachments are two 1536 × 1536 JPEG composite boards; each board contains two distinct UI references. This document describes only visible evidence. It does not claim access to the original design source files, CSS tokens, or exact pixel measurements.

## Reference 1 — Story Editor (left panel of attachment 1)

### Visible structure
- A black iOS-style status/header strip at the top, with time/status indicators and a centered glowing purple “ARS” wordmark.
- Main media preview fills most of the screen. It displays a purple-tinted night skyline beside water, with a palm silhouette at left.
- A circular close control sits near the preview's upper-left corner.
- A vertical editing toolbar is aligned along the right edge of the preview. Visible labels, top to bottom: Filters, Text, Stickers, Emoji, Draw, Crop & Rotate, Sound, Erase. Each has a circular outlined icon; Crop & Rotate wraps to two lines.
- A small “1.0x” control appears at the lower-left of the media preview.
- Below the preview is a horizontal filter strip with six visible options: None, Vivid, Moody, Dreamy, B&W, Neon. Each option has a thumbnail; None is highlighted with a bright purple outline.
- Below the filter strip is a video/timeline-style thumbnail track with a vertical playhead, play button at left, and sound control at right.
- Bottom action row: outlined “Save Draft” button on the left and filled purple “Next” button on the right.

### Appearance and proportions
- Predominantly black/dark navy background with dark purple media tint.
- Purple and lilac outlines, icons, and labels; the selected filter and primary Next button have stronger saturated purple emphasis/glow.
- The media preview is the dominant region, roughly the upper two-thirds of the left-hand phone UI; editing tools overlay its right side.
- Filter thumbnails and the timeline occupy separate horizontal bands under the preview. Bottom actions are large rounded pills.
- Fine exact spacing, typeface, and source color values cannot be recovered reliably from this composite raster.

### Not established by this image
- Actual effect implementation of filters, crop/rotate, erase, drawing, or sound.
- Whether the timeline appears for every story type; the screenshot shows a timeline-like strip.
- Exact supported media duration, export format, or accessibility behavior.

## Reference 2 — Create Post (right panel of attachment 1)

### Visible structure
- A dark rounded composer panel against a blurred black/purple glowing background.
- Header row: close X at left, centered title shown in Arabic in the reference, and a filled purple publish button at right.
- Account row with a purple circular avatar marked “R”, display name “Retova”, a verification mark, and handle “@retova”.
- Large rounded text area with a visible 0/280 character counter.
- Attachment row: dashed-border add-media tile followed by two image thumbnails, each with a small remove X.
- A compact row of six tools: Text, Hashtags, Location, Mention, Edit Media, Audience.
- Separate rounded settings rows for post visibility/privacy, comments (toggle appears enabled), adding the post to a story (toggle appears disabled), and posting to groups.
- Right-facing chevrons indicate rows that open a further choice or screen.

### Appearance and proportions
- Near-black cards with thin low-contrast purple/gray borders and rounded corners.
- Purple avatar, verification mark, active toggle, publish button, and icon accents.
- Composer content is stacked vertically with narrow gaps; controls use compact icon-over-label treatment in the tools row.
- The screenshot's labels are Arabic, but the project's accepted product requirement is English-only UI. Translate the visible concepts, not the Arabic strings, in the implementation.

### Not established by this image
- Exact audience choices, group picker behavior, maximum attachment count, accepted media types, and whether 280 is a hard limit for every post.
- The screenshot visibly includes photo thumbnails, but does not prove the behavior of audio/video uploads.

## Reference 3 — Home Feed (left panel of attachment 2)

### Visible structure
- Black header with a circular purple “R” account/avatar control at upper-left, centered “ARS” wordmark, and glowing wheel icon at upper-right.
- Horizontal stories row underneath: “You” with a plus badge, then named accounts (Lina, Noah, Sara), a Wheel circle, and branded/verified account circles (Apple, Ferrari, BMW). Story/account circles use purple outlines and small purple status badges.
- A vertically scrolling feed of rounded dark post cards.
- Each post includes a circular avatar, account name and verification indicator where shown, handle/time metadata, overflow menu, text, a large media image, and engagement metrics along the bottom.
- Visible post examples: Lina with a sunset image and heart/comment/repost/view counts; Apple with a device image and counts; Noah with a partial image visible below.
- A bright purple floating circular plus button sits above the bottom navigation near the lower-right side of the feed.
- Bottom navigation is a wide rounded capsule with five items shown in this screenshot: Home, Search, Trending, Notifications, Messages. Home is active and glows purple.

### Appearance and proportions
- Almost-black background; post cards are slightly lighter black with fine gray-purple outlines.
- White/light-lilac primary text, muted gray metadata, saturated purple accents for selected navigation, likes, badges, and floating plus.
- Story circles are horizontally arranged; feed cards span most of the phone width with modest outer margins.
- Media is prominent within posts, with rounded corners. Engagement icons and counts form a single row below each image.
- The screenshot's navigation is evidence of the design in this specific reference only. The latest accepted ARS requirement supersedes its labels/order: Home / Streak / Search / Profile / Notifications. Do not copy the older Search / Trending / Notifications / Messages arrangement.

### Not established by this image
- Feed ranking rules, pagination, exact story expiration behavior, or loading/error states.
- The reference shows sample brand accounts and posts; these are visual examples, not proof that those exact accounts or posts should be seeded into production.

## Reference 4 — Search / Explore (right panel of attachment 2)

### Visible structure
- Status strip at top and centered purple “ARS” wordmark.
- A wide rounded search field with magnifier at left, placeholder “Search for people, topics, or anything…”, and clear X at right.
- “Recent Searches” heading with “Clear All” aligned right; three visible recent entries (music, design, luna), each with a history icon and trailing X.
- “Trending Now” section with a trend icon, a right chevron, and three rows with square thumbnails, titles, and muted descriptions: New Music Releases, Aesthetic Vibes, Trending Creators. A “See More” link follows.
- “Popular Content” section with a play-style icon and right chevron; three horizontal media cards with small view/play counts.
- “Suggested Accounts” section with a person icon and right chevron; three circular avatars with display names/handles and verification marks.
- Bottom navigation shown in this reference: Home, Explore, a central plus, Notifications, Profile. Explore is active.

### Appearance and proportions
- Black/dark background, slim purple border around the search field, subtle horizontal separators, and generous vertical section spacing.
- Purple icons, active-state details, and small links; primary headings and names are pale white/lilac; supporting text is muted.
- Trending entries use square thumbnails; popular content uses wide landscape cards; suggested accounts use circular avatars in a horizontal row.
- As with Reference 3, the latest accepted project navigation supersedes this reference's exact labels/order: Home / Streak / Search / Profile / Notifications. Search is the corresponding destination; do not add Explore as a sixth navigation item.

### Not established by this image
- Whether recent searches persist across devices, exact ranking algorithms, and destinations/actions for each trending card.
- Search result types and empty/loading states are not shown.

## Cross-reference observations
- Shared visual language: near-black canvas, rounded cards/controls, fine dark-purple borders, lilac text/icons, vivid purple active states and occasional glow.
- ARS wordmark is centered in the top area in the visible app screens. Purple “R” avatars and circular icon treatments recur.
- Home is feed-and-stories oriented; Search/Explore is sectioned discovery content; Create Post is a settings-rich composer; Story Editor is media-first with tools overlaid along the preview edge.
- Floating Create Post plus and Story creation are separate entry points in the accepted project requirements: the floating plus opens Create Post; the circular plus in the user's story circle starts Story creation.
- The project's accepted English-only requirement applies even where the reference Create Post panel displays Arabic labels.
- No exact font family, design-token values, CSS pixel sizes, responsive breakpoints, or interaction outcomes can be determined from these raster composites alone.

## Implementation comparison checklist
- [ ] Preserve the near-black background, restrained purple outlines, lilac text, and stronger purple active/primary controls.
- [ ] Home: centered ARS brand, stories row above feed, rounded post cards, author metadata, media, engagement row, and floating plus above bottom navigation.
- [ ] Home stories row includes the user's story creation circle and story/account circles; wheel/rewards is not a bottom-nav item.
- [ ] Bottom navigation follows the accepted project order exactly: Home / Streak / Search / Profile / Notifications.
- [ ] Floating plus opens Create Post only; story-row plus opens Story creation only.
- [ ] Search: rounded search field, recent searches, trending rows, popular media cards, and suggested accounts.
- [ ] Create Post: account row, character-counted text field, removable media thumbnails, text/hashtag/location/mention/media/audience tools, visibility, comments, story toggle, and groups option.
- [ ] Story Editor: close control, large preview, right-side editing tools, filter strip, timeline controls where applicable, Save Draft, and Next.
- [ ] All interface labels are English.
- [ ] Required interactions are connected to real application behavior and persistence, not merely decorative controls.
- [ ] Compare actual browser screenshots against the supplied original references before making any claim of visual fidelity.
