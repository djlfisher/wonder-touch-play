

## Diagnosis

**Root Cause**: In `src/pages/Index.tsx` (line 148-154), the world wrapper div applies `transform: scale(1)` even when NOT transitioning:

```jsx
<div
  className="relative"  // no dimensions
  style={{
    transform: transitioning ? "scale(0.97)" : "scale(1)", // <-- BUG
  }}
>
```

In CSS, **any element with a `transform` property (even `scale(1)`) creates a new containing block** for `fixed`-positioned descendants. This means every world component's `fixed inset-0` container becomes positioned relative to this collapsed wrapper div (which has no height/width) instead of the viewport. That's why content is compressed at the top.

## Fix

**File: `src/pages/Index.tsx`**

Two changes to the world wrapper div (lines 148-154):

1. **Add `fixed inset-0`** to the wrapper so it fills the viewport (making the new containing block full-screen):
   ```jsx
   className="fixed inset-0"
   ```

2. **Set transform to `"none"` when not transitioning** so it doesn't unnecessarily create a containing block:
   ```jsx
   transform: transitioning ? "scale(0.97)" : "none",
   ```

This is a 2-line change. All 9 worlds use `fixed inset-0` internally, so once the parent containing block is either removed or made full-viewport, every world will render correctly again.

## Why this affects all worlds

Every world component (`ColorWorld`, `ShapeWorld`, `AlphabetWorld`, `NumberWorld`, `MusicWorld`, `MotionWorld`, `PatternWorld`, `ColorMixWorld`, `AnimalWorld`) uses `className="fixed inset-0"` as its root container. They all break identically when the parent has a `transform`.
