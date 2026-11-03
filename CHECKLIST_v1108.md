# v1.0.108 (t595u-t597u)
- Remove the 3D player character from the pause menu entirely (it shows giant).
- Revert the inventory organisation/layout to how it was before v1.0.98, but KEEP the new switching: LB/RB tabs between Inventory/Crafting, the bottom tabs, the B-exit hint, snappy moves. Crafting may keep its category tabs if compatible.
- Responsive UI: every menu (pause, settings, inventory, crafting, world list, dialogs, HUD) must fit and stretch to the screen in BOTH portrait and landscape on phones (e.g. 412x915 and 915x412) and on desktop. Use flexible sizing, scroll where needed, nothing cut off. Check both orientations by screenshot (don't send them).
- (t597u) Y in the inventory: move the item to the NEXT FREE hotbar slot each press, so pressing Y on several items in a row fills slots 1, 2, 3... without ever replacing a previous one. Same item type merges into an existing stack. Only if the hotbar is full, swap with the selected slot (the old item goes to the bag).
- Also: verify old-save brooch/quaich conversion, and fix the 2 water blocks leaking over the Agartha tunnel.
