# Font Size Test - All Themes

## Instructions

1. Open DevTools (F12)
2. Click on an H1 header
3. In the "Computed" tab, check the `font-size` value
4. It should show **28.8px** (which is 1.8rem × 16px) for ALL themes

---

# H1 Header - Measure This

Switch between themes and measure this H1 header using DevTools.

**Expected Result:**
- All themes: `font-size: 28.8px` (computed)
- All themes: `font-size: 1.8rem` (CSS)

**If you see different values**, there's a CSS override somewhere.

**If you see the SAME values but it LOOKS different**, that's the subpixel rendering optical illusion.

---

## How to Measure in DevTools

1. Right-click on "H1 Header - Measure This" above
2. Click "Inspect"
3. Look at the "Computed" tab on the right
4. Find `font-size` in the list
5. Note the value (should be 28.8px for all themes)

---

## Visual Comparison

### Polaris (Light Theme)
- Background: White
- Text: Dark
- **Perceived size**: Larger (due to subpixel rendering)

### Midnight Pro (Dark Theme)  
- Background: Dark
- Text: Light
- **Perceived size**: Smaller (due to grayscale antialiasing)

### The Truth
Both use **exactly the same CSS**: `font-size: 1.8rem !important`

The difference is **how your browser renders** light-on-dark vs dark-on-light text.
