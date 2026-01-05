# H1 Header Test

This is a test document to verify header sizes across themes.

## H2 Header Test

### H3 Header Test

#### H4 Header Test

##### H5 Header Test

###### H6 Header Test

---

## Testing Instructions

1. **Open this document in the editor**
2. **Switch to Polaris theme** - Look at the H1 size
3. **Switch to Midnight Pro theme** - H1 should look THE SAME SIZE as Polaris
4. **Switch to Nebula theme** - H1 should look THE SAME SIZE as Polaris
5. **Switch back to Polaris** - Confirm it matches the dark themes

---

## What You Should See

### Before the Fix (OLD behavior):

- Polaris H1: **LARGE** (1.8rem but looks big due to subpixel rendering)
- Midnight Pro H1: **SMALL** (1.8rem but looks small due to grayscale)
- **Result**: Polaris looked bigger ❌

### After the Fix (NEW behavior):

- Polaris H1: **LARGE** (1.8rem with subpixel rendering)
- Midnight Pro H1: **LARGE** (2rem with grayscale = visually matches Polaris)
- **Result**: Both look the same size ✅

---

## Console Verification

Check the browser console (F12) when switching themes:

**Polaris**:

```
📏 H1 Font Size: 1.8rem !important (isDark: false)
```

**Midnight Pro**:

```
📏 H1 Font Size: 2rem !important (isDark: true)
```

The **actual CSS values are different** (`1.8rem` vs `2rem`), but they should **look the same** visually because of browser rendering differences.

---

## If They Still Look Different

The issue might be:

1. **Browser zoom** - Reset to 100% (Ctrl+0)
2. **Editor zoom** - Check if editor zoom is different between themes
3. **Font family** - Verify both themes use the same font
4. **Cache** - Hard refresh (Ctrl+Shift+R)
