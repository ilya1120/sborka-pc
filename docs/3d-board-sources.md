# Motherboard / CPU visual reference notes

Implemented 25 November 2026. Positions are proportional visual measurements from the individual product photographs, in millimetres relative to the PCB top-left. They are not CAD or manufacturing measurements. Raised component depth is a plausible visual approximation. Tiny soldered parts/traces remain in the photographic PCB surface instead of invented geometry.

## Dimensions and official references

- MSI PRO B650M-A WIFI: 244 × 244 mm. https://www.msi.com/Motherboard/PRO-B650M-A-WIFI/Specification
- MSI PRO B760M-P DDR4: 244 × 244 mm. https://www.msi.com/Motherboard/PRO-B760M-P-DDR4 and https://storage-asset.msi.com/datasheet/mb/global/PRO-B760M-P-DDR4.pdf
- ASRock B650M Pro RS: 244 × 244 mm. https://www.asrock.com/mb/AMD/B650M%20Pro%20RS/
- ASUS PRIME B650M-R: width 221, height 236 mm. https://dlcdnets.asus.com/pub/ASUS/mb/SocketAM5/PRIME_B650M-R/E22817_PRIME_B650M-R_UM_WEB.pdf?model=PRIME+B650M-R
- ASUS PRIME B760M-K D4: width 211, height 244 mm. https://www.asus.com/motherboards-components/motherboards/prime/prime-b760m-k-d4/techspec/ (24.4 × 21.1 cm)
- GIGABYTE B760M DS3H DDR4 rev. 1.x: 244 × 244 mm. https://www.gigabyte.com/Motherboard/B760M-DS3H-DDR4-rev-1x/sp
- GIGABYTE B650M D3HP AX rev. 1.0/1.2: 244 × 244 mm. https://www.gigabyte.com/Motherboard/B650M-D3HP-AX-rev-10-12/sp

## Photographic PCB textures

- MSI B650 official orthographic front: https://storage-asset.msi.com/global/picture/product/product_1664782103bd0750526bf08cc98f5d01ef1436f9fa.webp
- MSI B760 official orthographic front: https://storage-asset.msi.com/global/picture/product/product_167273674400345d318e2f398cfc3c8a4def861321.webp
- Four ASUS/GIGABYTE front images: exact product Citilink photographs already fetched for catalogue expansion; URLs are preserved in work/new-product-image-manifest.json and src/product-images.js. Rotated counterclockwise 90 degrees and cropped to PCB extent, without synthesizing hardware.
- ASRock: existing catalogue image public/products/mb-asrock-b650.webp, source https://ttgshop.vn/mainboard-asrock-b650m-pro-rs . Perspective rectified to PCB rectangle. It remains a photographic approximation with some shroud parallax; not a new orthographic photograph. Official ASRock image links were identified, but direct downloads returned an HTML protection page, so that response was not used as an image.

All seven resulting textures are public/textures/motherboard/<product-id>.webp. Do not describe the ASRock image as sourced from DNS or Citilink. Board revision-specific connector position and I/O dimensions are approximations; hardware designs can differ between revisions.

## CPU references

All seven existing public/products/cpu-*.webp photographs were inspected via the established reference contact sheets, alongside corresponding Citilink images for the four additions. Exact existing source URLs remain in src/product-images.js. Geometry distinguishes the AM5 40 × 40 mm substrate and eight-notched nickel IHS from Intel LGA1700 37.5 × 45 mm substrate and elongated IHS. CPU branding/model labels are specific to all seven catalogue IDs. There are no fabricated serial numbers. Socket/load-plate/lever forms are proportional representations, not a vendor CAD assembly.

## Verification

Node syntax checks passed for both implementation modules. A headless construction smoke check with the actual createModelContext instantiated every one of the seven motherboards and AMD/Intel CPUs without exception, registering six motherboard cable ports each. Root agent performs visual integration checks and publication. Fine-scale component coordinates, cooler occlusion and chassis rear-slot alignment require the root visual check.
