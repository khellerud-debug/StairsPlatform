# StairsPlatform

Desktop-first workshop planner with optional stair modeling and live module placement context.

## UX structure (v1)

1. **Choose approach**
   - Quick design (minimal fields, useful default result)
   - Detailed stair design (extra geometry for better recommendations)
2. **Stair type selection cards**
   - Straight, L, L with landing, U, return/landing, custom
3. **Stair setup (progressive)**
   - Basic: rise, tread, width, steps
   - Advanced (optional): stairwell, landing, offsets, narrowing, handrail clearance
4. **Platform module configuration**
   - One or multiple modules, editable size and pocket strategy
   - Rough placement controls (x/y/rotation/show)
5. **Leg and pocket configuration**
   - Auto/manual leg heights and typical in-use leg count
6. **Visual previews**
   - Stair plan with module overlays
   - Module top and underside with frame-aware pocket logic
   - Side view with longest leg at left, shortest at right
7. **Outputs**
   - Platform summary, leg summary, BOM, cut list, notes/warnings
   - Print-ready output

## Data model overview

Main client-side state object:

- `mode`: quick or detailed
- `stair`: geometry and optional constraints
- `modules[]`:
  - dimensions/material defaults
  - pocket pattern and strategy
  - quantity and rough placement
- `legStrategy`, `manualHeights`, `typicalLegsInUse`

Derived data:

- confidence score + level (`Works`, `Good enough`, `Very well designed`)
- per-module pocket cell map (`frameSides` vs `blockSides`)
- recommended leg count, leg heights, weight estimate
- BOM lines and cut list rows
- notes/warnings

## Logic overview

- **Confidence system**: score from entered stair geometry, placement review, leg tuning, and multi-module coordination.
- **Module recommendation behavior**:
  - defaults to manageable size (600x900 mm)
  - warns for oversized width and long handling issues
- **Pocket logic**:
  - calculates pocket grid from selected pattern
  - each pocket identifies how many sides come from frame members vs added guide blocks
- **Leg logic**:
  - auto from rise multiples or grouped increments
  - manual override supported
- **Output logic**:
  - practical BOM and cut list from module + leg definitions
  - includes warning language that tool is planning-only (not certification)

## Run

Open `index.html` directly in a browser.

No backend required for v1.
