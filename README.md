# PixelLite v3.6 Phase 15

Editor improvements:
- Removed filter preset buttons.
- All ten requested CSS filter controls are sliders with live value labels.
- Filters are arranged in a compact two-column layout on desktop so all controls fit cleanly.
- Editor sections show only the selected section content; the old sidebar scrolling behavior is removed.
- Added Rotate / Flip controls with live preview and Apply Changes commit behavior.
- Added Batch Processing for multiple images using the last applied editor settings. Processing stays local in the browser and creates individual download links.
- Existing Home page layout was left unchanged.
- Existing image quality/format controls remain in Compress.

## Phase 15
- Prevented the mobile Apply/Download area from covering filter sliders.
- Kept all 10 filter sliders fully contained in the filter panel.
- After upload, the page now scrolls directly to the editor control panel instead of the bottom of the editor page.


## Phase 16 final editor layout
- Removed fixed/sticky panel height restrictions so the page scrolls normally.
- Removed nested sidebar scrolling.
- Filter controls use a natural 2-column layout with all ten sliders visible.
- Apply/Download actions are placed below the controls and never overlay them.
- After upload, the page scrolls to the top of the editor control panel, accounting for the sticky header.
- Home page was not changed.

Phase 17: Editor initial upload state now uses the same converter-page container and card geometry as the Converter page.
