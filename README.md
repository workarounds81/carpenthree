# Carpenthree — carpenthree.com

Website for Carpenthree, a Singapore carpentry studio and furniture shop.
It's a static site with no build step, hosted on GitHub Pages.

## Edit your details
| What | File |
|---|---|
| WhatsApp number, phone, email, address, delivery fee, GST | `js/config.js` |
| Shop products (name, price, size, lead time) | `js/products.js` |
| Page text | `index.html`, `shop.html` |
| Colours & fonts | top of `css/style.css` |

## Add photos
See **IMAGE-BRIEF.md** for a shot list. Until your photos are in, stock placeholders show (switch off in `js/placeholders.js`).

Drop JPGs into `images/` with these names. A slot shows a labelled tone block until its photo exists.

**Home page:** `hero.jpg`, `intro-chair.jpg`, `project-wardrobe.jpg`, `project-kitchen.jpg`,
`craftsman.jpg`, `bathroom.jpg`, `wwd-1.jpg`, `wwd-2.jpg`, `workshop-1.jpg` … `workshop-4.jpg`
**Shop:** `shop-hero.jpg`, plus one per product in `images/products/<product-id>.jpg`
(for example `images/products/teak-dining-table.jpg`)

Use landscape photos for the hero images, about 2000px wide, and square photos for products, about 1000px. Compress them first (for example with squoosh.app).

## How orders work
Customers add items to the cart and tap **Place order via WhatsApp**. That sends you a pre-filled message with the items, totals (including delivery; GST is added only if `gstRate` is set), and their name, mobile and address.
You then reply with a PayNow QR or a payment link.
To take card payments directly later, you can add Stripe Payment Links or move the shop to Shopify.

## Hosting (GitHub Pages + carpenthree.com)
1. In the repo, go to **Settings → Pages → Source: Deploy from a branch → `main` / root**.
2. At your domain registrar, add these DNS records:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` pointing to `workarounds81.github.io`
3. Once DNS has propagated, tick **Enforce HTTPS** in Settings → Pages.

The `CNAME` file in this repo already contains `carpenthree.com`.
