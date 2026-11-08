# Database migration

Run each migration script once against the BSSMS SQL Server database before deploying code that depends on it. Apply the supplier-price schema from `05_Rang_Buoc_Gia_Nha_Cung_Cap.sql` before the package migration.

`V002__product_purchase_packages.sql` keeps stock and service consumption in the product's base unit, while recording purchase-order quantities in packages. It sets the current milliliter consumables to 940 ml per massage-oil bottle and 970 ml per shampoo bottle, with a reorder threshold of 10 bottles each. Existing stock quantities are preserved in milliliters; existing purchase-order lines retain a conversion factor of 1.

For package-based products, supplier prices used by purchase orders must be the agreed price per package. Review those supplier prices before creating new orders.
