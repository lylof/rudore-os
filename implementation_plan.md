# Restoring Dark Mode & Refining Kanban Contrast

The goal is to fix the regressions in Dark Mode while maintaining the excellent Light Mode contrast. We will move away from hardcoded hex values inJSX and rely on the established theme variable system.

## Proposed Changes

### [Component Name] Kanban Board (KanbanBoard.tsx)

#### [MODIFY] [KanbanBoard.tsx](file:///c:/Users/lylof/PROJECT/remix_-rudore-os/components/Kanban/KanbanBoard.tsx)
- **Restore Dark Mode Header**: Remove the square background for icons in Dark Mode, or make it adapt correctly.
- **Theme-Aware Backgrounds**: 
    - Columns: Use `bg-rudore-sidebar/50` (or Sidebar variable) which is light grey in Light and black in Dark.
    - Headers/Footers: Use `bg-transparent` or theme variables.
- **COLUMN_CONFIG**: Update to avoid hardcoded "light" variants where possible, or ensure they are safely scoped.

### [Component Name] Kanban Card (KanbanCard.tsx)

#### [MODIFY] [KanbanCard.tsx](file:///c:/Users/lylof/PROJECT/remix_-rudore-os/components/Kanban/KanbanCard.tsx)
- **Restore Background**: Change card background to `bg-rudore-panel`. This is pure white in Light Mode and `#1E1E1E` in Dark Mode.
- **Contrast**: The distinction between `bg-rudore-panel` (Card) and `bg-rudore-sidebar` (Column) will provide the required "pop" in both modes.

## Verification Plan

### Manual Verification
- **Light Mode**: Confirm grey columns and white cards persist.
- **Dark Mode**: Confirm cards are dark, backgrounds are black, and no white elements leak through.
- **Contrast**: Check that cards are easily distinguishable from the column background in both modes.
