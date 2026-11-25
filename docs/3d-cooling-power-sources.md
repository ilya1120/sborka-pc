# Cooler and PSU geometry references

The 14 exact-model photographs in `public/products/<id>.webp` were inspected together in `work/cooling-power-reference.jpg`. Original retailer/source metadata is recorded in `src/product-images.js`. Geometry follows their colour, fin/cap arrangement, heatpipe count, grille family and modular/fixed cable construction. This is a procedural reconstruction, not manufacturer CAD. Tiny fasteners, fin counts, connector-bank placement and unpublished internal dimensions are visual estimates; they must not be advertised as engineering drawings.

## CPU coolers

- DeepCool AG400 ARGB: [manufacturer](https://www.deepcool.com/products/Cooling/cpuaircoolers/AG400-ARGB-120mm-CPU-Cooler-1851-1700-AM5/2022/16084.shtml), overall 125 × 92 × 150 mm, four 6 mm heatpipes, 120 × 25 mm fan. Silver exposed matrix top; no invented black AK-series cap.
- DeepCool AG400 WH ARGB: [manufacturer](https://www.deepcool.com/products/Cooling/cpuaircoolers/AG400-WH-ARGB-120mm-CPU-Cooler-1851-1700-AM5/2022/16086.shtml), corresponding white tower/fan and four pipes.
- DeepCool AK400: [manufacturer](https://www.deepcool.com/products/Cooling/cpuaircoolers/AK400-Performance-CPU-Cooler-1700-AM5/2021/15222.shtml), overall 127 × 97 × 155 mm; heatsink 120 × 45 × 152 mm; four pipes, 120 mm fan. Separate 45 mm fin depth avoids the old oversized cube.
- ID-COOLING SE-214-XT BASIC: [manufacturer](https://www.idcooling.com/product/detail?id=390&name=SE-214-XT+BASIC), 124 × 72 × 150 mm, four pipes and 120 × 25 mm fan; 47 mm fin depth inferred by subtracting fan thickness.
- ID-COOLING SE-224-XTS: [manufacturer](https://www.idcooling.com/product/detail?id=318&name=SE-224-XTS), 120 × 75 × 151 mm; four pipes, 120 × 25 mm fan, estimated 50 mm fin depth. Black tip caps follow the catalog photograph.
- DeepCool AG200: [manufacturer](https://www.deepcool.com/products/Cooling/cpuaircoolers/AG200-Single-Tower-CPU-Cooler/2022/16203.shtml), overall 119 × 77 × 133 mm; two pipes, 92 × 25 mm fan. Published heatsink dimensions are 94 × 57 × 133 mm, while overall airflow depth is 77 mm including a 25 mm fan. The reconstruction uses a 52 mm fin depth to keep the visible fan/tower envelope at 77 mm; this dimensional ambiguity is not silently treated as verified CAD.
- DeepCool AK500: [manufacturer](https://www.deepcool.com/products/Cooling/cpuaircoolers/AK500-High-Performance-CPU-Cooler/2022/16040.shtml), overall 127 × 117 × 158 mm; five pipes, 120 mm fan; approximately 90 mm fin depth and offset base from photographs.

Cooler axes follow installation: fins are plates in XY, stacked outward along Z from the CPU IHS; the fan face is YZ with airflow along X. Mounting spring screws, wire retaining clips and continuous U-shaped heatpipes are geometry. Fin counts and mounting crossbar shapes are approximate, because the supplied catalog photographs are not complete assembly drawings.

## Power supplies

PSU lengths below run along X, widths along Z and heights along Y before the AP201 installation rotation.

- DeepCool PK650D: [manufacturer](https://www.deepcool.com/products/PowerSupplyUnits/powersupplyunits/PK650D-80-PLUS-Bronze-Power-Supply/2022/15619.shtml/), 140 × 150 × 86 mm, 120 mm fan, fixed leads.
- DeepCool PL650D V2: [manufacturer](https://jp.deepcool.com/products/PowerSupplyUnits/powersupplyunits/PL650D-V2-ATX3.1-Direct-Power-Supply/2024/19111.shtml), [manual](https://www.deepcool.com/download/pdf/PL_D_V2.pdf), 140 × 150 × 86 mm, 120 mm fan, fixed leads. The selected catalog title does not state its revision; no revision-specific connector count is claimed.
- Corsair RM750e: [manufacturer](https://www.corsair.com/ww/en/p/psu/cp-9020262-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-cp-9020262-na), [manual](https://assets.corsair.com/image/upload/v1697839967/documents/psu/49_002690_AA_WW_RMe_Series_Web_QSG_F.pdf), 140 × 150 × 86 mm, 120 mm fan, fully modular. Triangular stamped grille follows the local product photo; the exact retail revision and connector layout cannot be established from that single view.
- MSI MAG A650BN: [manufacturer specifications](https://hk.msi.com/Power-Supply/MAG-A650BN/Specification), [datasheet](https://storage-asset.msi.com/datasheet/power-supply/global/MAG-A650BN.pdf), 140 × 150 × 86 mm, 120 mm fan, fixed leads. Parallel bars and hexagonal grille border follow the catalog photograph.
- Chieftec PROTON BDF-750C: [official 2025 catalog](https://www.chieftec.eu/upload/fs/catalogue-2025.pdf), 160 mm length, 140 mm fan, fully modular. Uses nominal ATX 86 mm height; older retailer listings sometimes state 87 mm. Circular wire guard follows product photo.
- Seasonic CORE V2 BC-850: [manufacturer](https://seasonic.com/core-bc/), 140 × 150 × 86 mm, 120 mm fan, fixed leads. Diagonal intake strips and silver model stripe follow the catalog photo.
- Montech CENTURY G5 850: [exact retailer listing](https://dns-shop.ge/en/product/0c419e832d05ed20/power-supply-montech-century-g5-850-century-g5-850-black/), 140 × 150 × 86 mm, fully modular, 120 mm fan. A matching current manufacturer dimensional drawing was not found; retailer dimensions and the supplied photo are used. Model-specific socket counts remain approximate.

The PSU shell is assembled from panels around an open intake with an actual internal impeller, separate guard, recessed IEC inlet, rocker switch, screws, visible connector cavities and metal pins. Modular connector banks show the correct construction family rather than an unsupported assertion of exact pinout. Cables use named anchors transformed together with the PSU when installed vertically at the front of AP201 cases. Both PSU and cooler labels derive from the selected actual brand/model.
