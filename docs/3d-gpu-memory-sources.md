# GPU, RAM and storage model references

All 21 catalogue photos were inspected in `work/gpu-memory-reference.jpg` (originals in `public/products/<product-id>.webp`; original photo page URLs in `src/product-images.js`). No generated photographs or synthetic photo textures are used. Procedural relief and text remain readable as the camera rotates. Product photos sometimes include packaging or perspective, so they were used as shape/color references rather than pasted onto a flat box.

## GPU specification sources

Manufacturer outer length × height × thickness in mm and power connector count/type:

- MSI RTX 4060 VENTUS 2X BLACK: 199 × 120 × 41, 1 × 8 pin. https://www.msi.com/Graphics-Card/GeForce-RTX-4060-VENTUS-2X-BLACK-8G-OC/Specification
- GIGABYTE RTX 4070 SUPER AERO: 300 × 130 × 57.6, 1 × 16 pin. https://www.gigabyte.com/vn/Graphics-Card/GV-N407SAERO-OC-12GD/sp
- Sapphire PULSE RX 7800 XT: 280 × 128.75 × 52.57, 2 × 8 pin. https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-7800-xt-16g-gddr6
- Palit RTX 5060 Dual OC: 262.1 × 126.3 × 40.1, 1 × 8 pin. https://www.palit.com/palit/vgapro.php?id=5565&lang=jp&pn=NE75060S19P1-GB2063D&tab=sp
- MSI RTX 5060 Ti 16G VENTUS 2X PLUS: 227 × 126 × 41, 1 × 8 pin. https://www.msi.com/Graphics-Card/GeForce-RTX-5060-Ti-16G-VENTUS-2X-PLUS/Specification (seven STORMFORCE blades)
- GIGABYTE RTX 5070 WINDFORCE: 282 × 110 × 50, 1 × 16 pin. https://www.gigabyte.com/Graphics-Card/GV-N5070WF3OC-12GD/sp
- Sapphire PULSE RX 9060 XT: 240 × 111.25 × 46.08, 1 × 8 pin. https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-9060-xt-16g-gddr6

Fan diameters, PCB length, exact power socket offset, heatpipe trajectories, fin spacing and screw placements are photo-based approximations, not manufacturer mechanical drawings. `ctx.ports.gpuPower` (and `gpuPower2` on the 7800) marks the rendered socket opening exactly, so cable routes join the model without a gap. The endpoint's absolute relation to a physical product is approximate. Open extruded fan apertures/backplate slots, fin instances and heatpipes replace a solid generic box.

## RAM envelope references

- Kingston RGB DDR5: 133.35 × 42.23 × 7.11 mm. https://www.kingston.com/unitedkingdom/en/memory/gaming/kingston-fury-beast-ddr5-rgb-memory and https://www.kingston.com/datasheets/KF564C32BBA-16.pdf
- XPG LANCER RGB: 133.35 × 43.56 × 8 mm, not the 40 mm LANCER BLADE. https://www.xpg.com/en/xpg/dram-modules-lancer-rgb-ddr5?tab=spec
- XPG GAMMIX D35: 133.35 × 34 × 5.9 mm. https://www.xpg.com/ph/xpg/dram-modules-gammix-d35-ddr4?tab=spec
- Kingston Beast non-RGB DDR5: family envelope 133.35 × 34.9 × 6.62 mm. https://www.kingston.com/datasheets/KF552C40BBK2-64.pdf (related family revision; exact catalogue suffix is BB2K2).
- Kingston non-RGB DDR4 34.1 mm height / 7.2 mm thickness, Patriot Steel 44.4 / 7 mm and Venom 43 / 7 mm are modelling estimates pending exact mechanical drawings. Patriot reference product page: https://www.patriotmemory.com/en/products/viper-steel-ddr4-performance-memory-ram-viper-gaming-by-patriot-memory . Do not use these values for clearance certification.

Separate angular heatspreader outlines, diagonal ribs and branding follow the catalogue photos. RGB diffuser/emission exists only on the two RGB products. DIMM gold-contact notch positions and internal SMD placements are illustrative. `board.dimmPositions` provides actual motherboard slot X positions; two modules occupy A2/B2 on four-slot boards and both physical slots on two-slot boards. No phantom slots are introduced.

## Storage references and limitations

All five NVMe products are catalogue M.2 2280: 80 × 22 mm. Component/label layouts are interpreted from original product photos, with different blue/black PCBs and label colors. Thicknesses 2.2–2.4 mm are nominal visual profiles. Printed labels use true brand/model and capacity, with illustrative non-encoded barcode strokes rather than invented serial/QR data. NAND/controller placement varies by hardware revision. The rendered M.2 mounting screw is real geometry.

WD Blue uses the common 3.5-inch 147 × 101.6 × 26.1 mm envelope; the catalogue lacks an exact model number, so internal/top stamping is approximate. The ST2000DM008 Seagate is the thinner 146.99 × 101.85 × 20.2 mm model: https://www.seagate.com/support/internal-hard-drives/desktop-hard-drives/barracuda-3-5/ . Both have separate 15-contact SATA power and 7-contact data connections, stamped lids, labels and mounting screws. `sataPower`/`sataDataDrive` ports mark their socket entries.

Storage mounting defaults: NVMe below CPU (`board.m2` override supported); HDD in front lower tray (`layout.storage` override supported). These are scene mounting positions, not a promise that every chassis tray uses that exact position.

## Verification

Headless real Three.js/context construction passed for all seven GPUs, seven RAM kits and seven storage products. Every generated bounding box was finite; all GPU/SATA wiring ports were present; all RAM kits passed both four-slot A2/B2 and two-slot 0/1 occupancy checks. Fins/contacts/chips use instances. Root handles browser rendering/visual verification and publication.
