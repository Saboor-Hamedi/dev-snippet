# Flow Mode Performance Optimization Proposal

To achieve "Zero-Latency" performance in Flow Mode while maintaining its premium aesthetic, the following technical optimizations are proposed:

## 1. Visual Engine Optimizations (GPU)
*   **Layer Isolation**: Apply `will-change: transform, top, left` and `contain: layout paint` to the Flow window. This instructs the browser to promote the window to a separate GPU compositor layer, preventing it from triggering layout calculations for the main application during movement.
*   **Motion Decoupling**: During active dragging, the expensive `backdrop-filter: blur()` will be temporarily swapped for a high-performance semi-transparent solid background. This eliminates the heavy pixel-per-pixel blur recalculation while the window is in motion.
*   **Frame Optimization**: Force `transition: none !important` on the entire Flow window tree during movement to ensure the window follows the cursor position instantly without "rubber-banding" lag.

## 2. Event & Logic Optimizations (CPU)
*   **Interaction Lockdown**: Disable all pointer-events on children inside the Flow window during a drag. This prevents the browser from checking for hover-states and firing script-based listeners while the window is moving.
*   **Throttled Rendering**: Implement an adaptive debounce for the preview update. 
    *   Small Files: Instant Refresh.
    *   Large Files (>10k chars): Throttled to 300ms-500ms to prevent CPU saturation.

## 3. Implementation Plan
*   Update `universalStyle.css` with layer promotion and motion-aware styling.
*   Refine `draggable.js` to handle global state hints for the CSS engine.
*   Tune `FlowPreview.jsx` logic to respect file-size based rendering delays.

---
**Goal**: Reduce the performance overhead of Flow Mode by ~70% during active interaction, making the desktop experience feel lightweight and native.
