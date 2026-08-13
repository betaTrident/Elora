# Elora

## 5-minute demo script

Reinstall the app so Shopify grants `write_products`, then seed:

`cd app/server; npm run db:seed`

1. Open app in Admin — see Dashboard with 3 sample rituals
2. Note "AM Glow Ritual" score and breakdown
3. In Shopify Admin → Products, set Glow Drops Serum inventory to 0
4. Back in RitualScore → AM Glow Ritual → click Recalculate
5. Score drops — Critical alert appears: "Out of stock"
6. Open Activity log — see score.recalculated + alert.opened events
7. On storefront Home, click "Build your soft ritual" → complete steps → Add ritual to bag
8. Cart shows all 3 items with "Elora Ritual: glow · am · clean" property
