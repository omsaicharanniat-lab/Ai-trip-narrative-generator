---
name: Horizon Ethos
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434653'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#1d59c1'
  primary: '#003c90'
  on-primary: '#ffffff'
  primary-container: '#0f52ba'
  on-primary-container: '#bcceff'
  inverse-primary: '#b0c6ff'
  secondary: '#ac3509'
  on-secondary: '#ffffff'
  secondary-container: '#fe6f42'
  on-secondary-container: '#631800'
  tertiary: '#004940'
  on-tertiary: '#ffffff'
  tertiary-container: '#006358'
  on-tertiary-container: '#62e2ce'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00419c'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#852300'
  tertiary-fixed: '#79f7e3'
  tertiary-fixed-dim: '#59dbc7'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005047'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for a premium yet accessible travel experience. The brand personality is adventurous, reliable, and highly organized, aiming to reduce the cognitive load of travel planning. The emotional response should be one of "anticipatory joy"—the feeling of a vacation beginning the moment the app or site is opened.

The visual style is **Modern/Airy**, leaning into high-quality whitespace and a clear visual hierarchy. It utilizes subtle depth and soft transitions to create a frictionless user journey. The interface prioritizes clarity for long-form itineraries while maintaining high energy for discovery and booking phases.

## Colors
The palette is built on a foundation of trust and action. 

*   **Primary (Sapphire Trust):** Used for headers, primary navigation, and established brand moments. It conveys stability and professionalism.
*   **Secondary (Solar Energy):** Reserved strictly for high-priority calls to action (CTAs), price highlights, and "Book Now" interactions.
*   **Tertiary (Expedition Teal):** Used for success states, badges, and secondary features like "Inclusions" or "Sustainability" tags.
*   **Neutral (Cloud Gray):** A range of soft grays used for backgrounds and borders to keep the UI feeling light and expansive.

## Typography
The typography strategy balances editorial elegance with functional density. 

**Plus Jakarta Sans** is used for headings to provide a friendly, modern, and slightly geometric feel that works exceptionally well for destination titles and marketing copy. 

**Work Sans** is used for all body text and UI labels. Its slightly wider apertures ensure maximum legibility for long-form tour descriptions and technical itinerary details. Heavy use of font weight contrast (Medium vs. Regular) is encouraged to guide the eye through dense information.

## Layout & Spacing
This design system utilizes a **Fluid Grid** with a 12-column structure for desktop and a 4-column structure for mobile. 

*   **Rhythm:** An 8px base unit governs all padding and margin.
*   **Verticality:** Content blocks (e.g., Tour Highlights, Reviews) should be separated by large vertical gaps (64px to 80px) to maintain the "Airy" brand promise.
*   **Responsiveness:** On mobile, side margins shrink to 16px to maximize real estate for imagery, while desktop margins expand to 40px to provide a generous frame for the content.

## Elevation & Depth
Depth is used sparingly to signify interactivity and layering. 

*   **Surface Tiers:** Backgrounds are `#F8FAFC`. Primary cards and containers use a pure `#FFFFFF` surface.
*   **Ambient Shadows:** Use soft, diffused shadows with a slight blue tint (e.g., `0 4px 20px rgba(15, 82, 186, 0.08)`).
*   **Interaction Elevation:** Buttons and cards should slightly lift (increase shadow spread and Y-offset) on hover to provide tactile feedback.
*   **Glassmorphism:** Use for fixed navigation bars and image overlays (e.g., price tags over destination photos) with a 12px blur and 80% white opacity to maintain legibility without obscuring the photography.

## Shapes
The shape language is consistently **Rounded**. 

*   **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
*   **Large Containers:** Tour cards and image carousels use a 1rem (16px) radius to feel approachable and modern.
*   **Iconography:** Icons should feature rounded terminals and a consistent 2px stroke weight to match the softness of the UI components.

## Components
*   **Buttons:** Primary buttons use the secondary orange with white text for maximum "pop." Secondary buttons use a blue outline. Use large padding (16px 32px) to ensure they are touch-friendly.
*   **Cards:** Travel cards must feature a high-aspect-ratio image (16:9 or 4:3), a clear title, and a "floating" price badge using the glassmorphism style.
*   **Input Fields:** Use a subtle 1px border (`#E2E8F0`) that thickens and turns primary blue on focus. Include clear placeholder text and leading icons for "Location" or "Date" inputs.
*   **Chips:** Use for categories like "Beach," "Adventure," or "Budget." They should have a light blue background with dark blue text and fully rounded (pill) corners.
*   **Lists/Itineraries:** Use a vertical "timeline" style with icons for different activities (e.g., a plane icon for flights, a bed for hotels) to make long schedules scannable.
*   **Booking Bar:** A persistent "sticky" bottom bar on mobile and a right-hand sidebar on desktop that keeps the price and "Book Now" button visible at all times during the user's research phase.