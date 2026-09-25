# PixelLite

PixelLite is a free, browser based image editor and converter available at **https://pixellite.in**.

Images are processed locally in the browser. The project is a static website and does not require a server side image upload for editing or conversion.

## Current release

**PixelLite v3.6 Phase 30**

Phase 30 documents the active Google Analytics configuration after validating the replacement GA4 web stream. The active Measurement ID is `G-QHZR2VLP4X`. The previous stream `G-KYXXS5396T` is retained in the GA4 property for reference and is no longer used by the website.

## Pages

- **Home** (`index.html`) — landing page and tool selection.
- **Editor** (`editor.html`) — browser based image editing.
- **Converter** (`convert.html`) — PNG, JPG and WEBP conversion.
- **About** (`about.html`) — project information.
- **Contact** (`contact.html`) — contact information.
- **Privacy** (`privacy.html`) — privacy information.

## Image Editor

The Editor uses an upload first workflow. Editing controls become available after an image is selected or dropped.

### Editor sections

- **Resize** — change width and height, with aspect ratio locking.
- **Crop** — crop the image using the available crop controls and aspect ratios.
- **Filters** — live adjustment sliders.
- **Rotate / Flip** — rotate the image and flip horizontally or vertically.
- **Compress** — choose output format and image quality.

### Filter controls

The current Editor uses slider based controls for:

1. Blur
2. Brightness
3. Contrast
4. Grayscale
5. Hue Rotate
6. Invert
7. Opacity
8. Saturate
9. Sepia
10. Drop Shadow

### Apply Changes workflow

Editor changes are divided into pending and applied state.

- Slider and control changes are previewed on the image.
- Pending changes are not permanently committed until **Apply Changes** is selected.
- If the user changes to another editor section without applying the current changes, the pending changes are discarded and the last applied image state is restored.
- Download remains unavailable while there are unapplied changes.
- **Reset** restores the original uploaded image.
- Applied filter and adjustment values remain represented by the editor controls after applying them.

## Image Converter

The Converter provides:

- PNG output
- JPG output
- WEBP output
- Quality control where applicable
- Estimated output size feedback
- Convert & Download workflow

After an image is uploaded, the Converter automatically scrolls to the **top of the conversion controls**, matching the established Editor upload behavior. The fixed header is accounted for so the control area starts in view.

## Upload and navigation behavior

Both Editor and Converter use an upload first workflow.

After uploading an image:

1. The image is loaded in the browser.
2. The workspace becomes visible.
3. The page moves to the top of the relevant control area rather than jumping to the end of the page.

## UI and responsive behavior

- Responsive desktop and mobile layouts.
- Drag and drop image upload.
- Click based file selection.
- Editor feature sections are shown one at a time.
- The Home page tool cards are clickable without unwanted browser link underlines.
- The Editor filter controls use a compact two column layout so the full filter set can be displayed without overlapping the Apply Changes area.
- The Home page layout is intentionally preserved while editor and converter behavior are updated.

## Project structure

```text
PixelLite/
├── assets/
│   ├── favicon.svg
│   └── placeholder-editor.png
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── converter.js
├── CNAME
├── about.html
├── contact.html
├── convert.html
├── editor.html
├── index.html
├── privacy.html
├── robots.txt
├── sitemap.xml
└── README.md
```

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- HTML Canvas API for browser based image processing
- GitHub Pages for static hosting
- Cloudflare DNS for the custom domain
- Google Analytics for website analytics
- Google Search Console for indexing and search visibility

No application server is required for the core image editing and conversion functionality.

## SEO and site configuration

The project includes:

- Page titles and descriptions
- Canonical URL configuration
- `robots.txt`
- `sitemap.xml`
- Favicon
- Google Analytics
- Google Search Console setup
- Custom domain configuration through `CNAME`

The production domain is:

**https://pixellite.in/**

## Google Analytics

The production website uses Google Analytics 4 with the following active web stream:

- Stream name: **PixelLite Web – Active**
- Measurement ID: **G-QHZR2VLP4X**
- Domain: **https://pixellite.in/**

The website uses Google Consent Mode before the GA4 configuration call. The active stream was validated through Google Tag Assistant and GA4 Realtime, including page view and session events.

The older GA4 stream `G-KYXXS5396T` remains in the GA4 property but is not referenced by the production website.

## Deployment

PixelLite is deployed through **GitHub Pages** from the `main` branch.

The repository uses the custom domain defined in `CNAME`.

For a normal website update:

1. Update the required HTML, CSS or JavaScript files.
2. Keep the repository structure intact.
3. Commit the changes to `main`.
4. Allow GitHub Pages to deploy the new commit.
5. Verify the live site at `https://pixellite.in`.

## Version history

### Phase 30 — GA4 active stream documentation
- Confirmed the replacement GA4 stream receives live Realtime data.
- Renamed the working stream to **PixelLite Web – Active**.
- Documented the active Measurement ID `G-QHZR2VLP4X`.
- Confirmed the production pages use the active Measurement ID.

### Phase 29 — GA4 diagnostic stream
- Added and validated a replacement GA4 web stream.
- Updated the production pages to use `G-QHZR2VLP4X`.

### Phase 28 — Google Consent Mode
- Added Google Consent Mode defaults before the GA4 configuration.
- Validated consent state through Google Tag Assistant.

### Phase 3
- Separated the project into dedicated HTML, CSS and JavaScript files.
- Established the structured multi page website foundation.

### Phase 4
- Added the Image Converter page.
- Added the broader multi page PixelLite structure.
- Improved the upload first workflow.

### Phase 5
- Refined Editor and Converter UI alignment.
- Added clickable Editor feature controls.
- Introduced the common Apply Changes workflow.
- Improved Reset and editor action behavior.

### Phase 6
- Expanded unified Apply Changes behavior across Editor operations.
- Added pending change tracking.
- Prevented Download while unapplied changes exist.
- Improved editor control placement and interaction behavior.

### Phase 7
- Fixed Reset so it restores the original uploaded image.
- Improved Editor section navigation and control behavior.
- Preserved the established Home page structure.

### Phase 8
- Fixed Home page tool card navigation.
- Removed unwanted link underline behavior from the Home tool cards.
- Improved accordion behavior and editor control layout.

### Phase 9
- Changed the Editor to display one selected control section at a time.
- Improved Converter quality feedback and estimated output size behavior.

### Phase 10
- Fixed Editor filter state handling.
- Restored Brightness, Contrast and Saturation controls.
- Standardized the initial Editor and Converter upload presentation.

### Phase 11
- Fixed filter state persistence after Apply Changes.
- Expanded the filter control system.

### Phase 12
- Added live filter preview while changes remain pending.
- Pending changes are discarded when switching Editor sections without applying them.
- Improved filter layout and Apply Changes behavior.

### Phase 13
- Reworked the filter system around slider controls.
- Added Rotate / Flip functionality.
- Improved image quality and format controls.
- Batch processing was explored during this phase.

### Phase 14
- Removed batch / multiple image processing from the Editor.
- Improved the compact filter layout.
- Added automatic navigation to the Editor controls after upload.

### Phase 15
- Fixed filter controls being covered by the Apply Changes area.
- Improved filter visibility and upload navigation.

### Phase 16 — stable Editor baseline
- Removed fixed height restrictions that were clipping Editor controls.
- Removed problematic nested Editor panel scrolling.
- Ensured all ten filter sliders fit within the available layout.
- Kept Apply Changes and Download below the controls.
- After upload, the page moves to the top of the Editor control panel.
- Preserved the Home page.

### Phase 17 — stable layout baseline
- Standardized the initial Editor upload presentation with the Converter upload container and card geometry.
- Preserved the stable Phase 16 Editor behavior.
- This became the baseline for the later work.

### Phase 18 — experimental
- Attempted to remove the Editor and Converter sidebars.
- This layout direction was later rejected and is not the current baseline.

### Phase 19 — experimental
- Attempted a site wide sidebar removal using CSS.
- The approach did not correctly remove the intended Editor panel and was abandoned.

### Phase 20 — experimental
- Attempted to remove the actual Editor panel container and restore a full width layout.
- The resulting alignment was rejected.

### Phase 21 — experimental
- Added global `overflow: hidden`.
- This prevented normal page scrolling and was later reverted.

### Phase 22 — experimental
- Changed global overflow to hide horizontal overflow while allowing vertical scrolling.
- This direction was subsequently abandoned in favor of the Phase 17 baseline.

### Phase 23 — experimental
- Attempted another side column removal and full width control layout.
- This was rejected and is not part of the current baseline.

### Phase 24 — current release
- Used Phase 17 as the layout baseline.
- Added the same post upload navigation behavior to the Converter that already existed in the Editor.
- After an image is uploaded on the Converter page, the page scrolls to the **top of the conversion controls**.
- The header offset is accounted for so the top of the control area remains visible.
- No changes were made to the Home page.
- Existing Editor filter and Apply Changes behavior was preserved.

## GitHub commit history guidance

The repository can document the complete development history in this README without retaining rejected experimental layout changes in the production code.

The preferred stable progression is:

```text
Phase 3 → Phase 4 → ... → Phase 16 → Phase 17 → Phase 24
```

Phases 18–23 are documented above as experimental iterations that were tested and subsequently rejected.

## Privacy

PixelLite's core image editing and conversion operations are performed locally in the browser. Images do not need to be uploaded to a PixelLite application server for processing.

For the complete privacy statement, see `privacy.html`.


## Phase 25

Added a dedicated 1200×630 Open Graph social preview image for PixelLite and updated the homepage Open Graph and Twitter image metadata to use it. This improves link previews when sharing `https://pixellite.in/`.


## Phase 26

Improved mobile navigation across all pages. The desktop navigation remains unchanged, while phones and narrow screens use a compact hamburger menu to prevent navigation links from overlapping the header.

## Phase History
- Phase 27: `PixelLite v3.6 Phase 27 add Google AdSense site verification and ads.txt`


## Phase 28

Added Google Consent Mode v2 defaults to all six HTML pages. Region-specific defaults deny analytics and advertising storage in the EEA, UK and Switzerland until the configured Google consent solution provides an update. Visitors outside those regions retain the normal granted default so Analytics measurement is not unnecessarily suppressed where the regional consent banner does not apply. A 500 ms `wait_for_update` is used for the regional denied state to give the consent solution time to update the Google tag. No editor, converter, styling, navigation, AdSense, or asset functionality was changed.
