(function () {
  const S = window.SITE;
  const P = window.PRODUCTS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = (n) => {
    const d = Number.isInteger(n) ? 0 : 2;
    return "S$" + n.toLocaleString("en-SG", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const waLink = (text) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Photos: hide the label once a real image loads ---------- */
  // Tries your own file first, then the inspiration placeholders (js/placeholders.js).
  const PH = window.PLACEHOLDERS || { enabled: false, slots: {} };
  // Size requests to the slot on screen (capped at 2x pixel density) so phones get small files.
  function slotSize(el) {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = r.width || 800, ch = r.height || cw * 0.75;
    const w = Math.min(2000, Math.ceil((cw * dpr) / 200) * 200);
    return { w, h: Math.round(w * (ch / cw)) };
  }
  function candidates(src, el) {
    const list = [{ url: src, own: true }];
    const slot = PH.enabled && PH.slots[src];
    if (slot) {
      const [id, kw] = slot;
      const { w, h } = slotSize(el);
      if (id) list.push({ url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=60` });
      const lock = [...src].reduce((a, c) => a + c.charCodeAt(0), 0);
      if (kw) list.push({ url: `https://loremflickr.com/${Math.min(w, 1200)}/${Math.min(h, 1200)}/${kw}/all?lock=${lock}` });
    }
    return list;
  }
  function loadPhoto(el) {
    // Use the smaller mobile file when one is given and the screen is narrow
    const src = el.dataset.srcMobile && window.innerWidth <= 900 ? el.dataset.srcMobile : el.dataset.src;
    const list = candidates(src, el);
    const tryNext = (i) => {
      if (i >= list.length) return;
      const img = new Image();
      img.decoding = "async";
      if (el.closest(".hero")) img.fetchPriority = "high";
      img.onload = () => {
        // Absolute URL: a relative url() inside a CSS variable resolves against css/, not the page
        el.style.setProperty("--img", `url("${new URL(list[i].url, location.href).href}")`);
        el.classList.add("loaded");
        if (!list[i].own) { el.classList.add("placeholder"); el.dataset.file = src.replace("images/", ""); }
      };
      img.onerror = () => tryNext(i + 1);
      img.src = list[i].url;
    };
    tryNext(0);
  }
  // Lazy-load: the hero loads immediately; everything else loads shortly before it scrolls into view.
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { io.unobserve(e.target); loadPhoto(e.target); }
      }), { rootMargin: "400px 0px" })
    : null;
  function initPhotos(root = document) {
    $$(".photo[data-src]:not([data-init])", root).forEach((el) => {
      el.dataset.init = "1";
      if (io && !el.closest(".hero")) io.observe(el); else loadPhoto(el);
    });
  }

  /* ---------- Site-wide details ---------- */
  $$("[data-site='phone']").forEach((el) => (el.textContent = S.phoneDisplay));
  $$("[data-site='email']").forEach((el) => { el.textContent = S.email; el.href = "mailto:" + S.email; });
  $$("[data-site='address']").forEach((el) => (el.textContent = S.address));
  $$("[data-site='wa']").forEach((el) => (el.href = waLink("Hi Carpenthree, I'd like to enquire about")));
  $$("[data-site='year']").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Mobile nav ---------- */
  const toggle = $(".menu-toggle");
  if (toggle) toggle.addEventListener("click", () => $(".nav-links").classList.toggle("open"));

  /* ---------- Cart state ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("c3-cart") || "[]"); } catch (e) { cart = []; }
  cart = cart.filter((i) => P.some((p) => p.id === i.id));
  const save = () => { try { localStorage.setItem("c3-cart", JSON.stringify(cart)); } catch (e) {} };
  const find = (id) => P.find((p) => p.id === id);

  function totals() {
    const sub = cart.reduce((s, i) => s + find(i.id).price * i.qty, 0);
    const delivery = sub === 0 || sub >= S.freeDeliveryFrom ? 0 : S.deliveryFee;
    const gst = Math.round((sub + delivery) * S.gstRate * 100) / 100;
    return { sub, delivery, gst, total: sub + delivery + gst };
  }

  function add(id) {
    const line = cart.find((i) => i.id === id);
    line ? line.qty++ : cart.push({ id, qty: 1 });
    save(); renderCart(); toast(`${find(id).name} added to cart`);
  }
  function setQty(id, q) {
    cart = cart.map((i) => (i.id === id ? { ...i, qty: q } : i)).filter((i) => i.qty > 0);
    save(); renderCart();
  }

  /* ---------- Drawer markup (shared by all pages) ---------- */
  document.body.insertAdjacentHTML("beforeend", `
    <div class="drawer-backdrop" data-close></div>
    <aside class="drawer" aria-label="Shopping cart" aria-hidden="true">
      <div class="drawer-head"><h3>Your Cart</h3><button data-close aria-label="Close cart">×</button></div>
      <div class="drawer-body"><div id="cart-items"></div><div id="cart-summary"></div></div>
    </aside>
    <div class="toast" role="status"></div>
    <a class="wa-float" href="${waLink("Hi Carpenthree, I'd like to get a quote. Here are my photos / measurements:")}" target="_blank" rel="noopener" aria-label="Get a quote on WhatsApp">
      <svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>
      <span>Get Quote</span>
    </a>`);

  const openCart = () => { document.body.classList.add("cart-open"); $(".drawer").setAttribute("aria-hidden", "false"); };
  const closeCart = () => { document.body.classList.remove("cart-open"); $(".drawer").setAttribute("aria-hidden", "true"); };
  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  $$("[data-close]").forEach((b) => b.addEventListener("click", closeCart));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

  let toastTimer;
  function toast(msg) {
    const t = $(".toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function renderCart() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $$(".cart-count").forEach((el) => { el.textContent = n || ""; el.dataset.n = n; });

    const items = $("#cart-items"), summary = $("#cart-summary");
    if (!cart.length) {
      items.innerHTML = `<p class="empty">Your cart is empty.</p>`;
      summary.innerHTML = `<a class="btn btn-block" href="shop.html">Browse furniture</a>`;
      return;
    }
    items.innerHTML = cart.map((i) => {
      const p = find(i.id);
      return `<div class="cart-item">
        <div class="photo mid" data-src="images/products/${p.id}.jpg"></div>
        <div><h4>${esc(p.name)}</h4><small>${money(p.price)} · ${esc(p.lead)}</small>
          <div class="qty"><button data-dec="${p.id}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Increase">+</button></div></div>
        <button class="remove" data-rm="${p.id}">Remove</button></div>`;
    }).join("");
    const t = totals();
    const toFree = S.freeDeliveryFrom - t.sub;
    summary.innerHTML = `
      <div style="margin-top:16px">
        <div class="sum-row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
        <div class="sum-row"><span>Delivery</span><span>${t.delivery ? money(t.delivery) : "Free"}</span></div>
        ${S.gstRate ? `<div class="sum-row"><span>GST (${Math.round(S.gstRate * 100)}%)</span><span>${money(t.gst)}</span></div>` : ""}
        <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>
        ${toFree > 0 ? `<p class="note">Add ${money(toFree)} more for free islandwide delivery.</p>` : ""}
      </div>
      <form class="checkout" id="checkout">
        <div class="field"><label for="co-name">Name</label><input id="co-name" required autocomplete="name"></div>
        <div class="field"><label for="co-phone">Mobile</label><input id="co-phone" required type="tel" autocomplete="tel" placeholder="+65"></div>
        <div class="field"><label for="co-addr">Delivery address &amp; postal code</label><textarea id="co-addr" rows="2" required autocomplete="street-address"></textarea></div>
        <button class="btn btn-wa btn-block" type="submit">Place order via WhatsApp</button>
        <p class="note">We'll confirm stock and delivery date, then send a PayNow or card payment link.</p>
      </form>`;
    initPhotos(items);

    $("#checkout").addEventListener("submit", (e) => {
      e.preventDefault();
      const lines = cart.map((i) => `• ${find(i.id).name} × ${i.qty} = ${money(find(i.id).price * i.qty)}`).join("\n");
      const msg = `Hi Carpenthree, I'd like to place an order:\n\n${lines}\n\nSubtotal: ${money(t.sub)}\nDelivery: ${t.delivery ? money(t.delivery) : "Free"}\n` +
        (S.gstRate ? `GST: ${money(t.gst)}\n` : "") + `Total: ${money(t.total)}\n\nName: ${$("#co-name").value}\nMobile: ${$("#co-phone").value}\nAddress: ${$("#co-addr").value}`;
      window.open(waLink(msg), "_blank", "noopener");
    });
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm]");
    if (!b) return;
    if (b.dataset.add) add(b.dataset.add);
    if (b.dataset.inc) setQty(b.dataset.inc, cart.find((i) => i.id === b.dataset.inc).qty + 1);
    if (b.dataset.dec) setQty(b.dataset.dec, cart.find((i) => i.id === b.dataset.dec).qty - 1);
    if (b.dataset.rm) setQty(b.dataset.rm, 0);
  });

  /* ---------- Product grids ---------- */
  const card = (p) => `<article class="product">
      <div class="photo mid" data-src="images/products/${p.id}.jpg" data-label="${esc(p.name)}" style="position:relative">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}</div>
      <div class="product-body">
        <span class="product-cat">${esc(p.category)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="product-desc">${esc(p.desc)}</p>
        <span class="product-meta">${esc(p.dims)} · ${esc(p.lead)}</span>
        <div class="product-foot"><span class="price">${money(p.price)}</span><button class="btn" data-add="${p.id}">Add to cart</button></div>
      </div></article>`;

  const featured = $("#featured-products");
  if (featured) { featured.innerHTML = P.filter((p) => p.tag).concat(P.filter((p) => !p.tag)).slice(0, 4).map(card).join(""); }

  const grid = $("#product-grid");
  if (grid) {
    const cats = ["All", ...new Set(P.map((p) => p.category))];
    let cat = new URLSearchParams(location.search).get("cat") || "All";
    if (!cats.includes(cat)) cat = "All";
    let sort = "featured";
    const filters = $("#filters");
    const draw = () => {
      filters.innerHTML = cats.map((c) => `<button class="chip ${c === cat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
      let list = P.filter((p) => cat === "All" || p.category === cat);
      if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
      if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
      grid.innerHTML = list.map(card).join("");
      initPhotos(grid);
    };
    filters.addEventListener("click", (e) => { const c = e.target.closest("[data-cat]"); if (c) { cat = c.dataset.cat; draw(); } });
    $("#sort").addEventListener("change", (e) => { sort = e.target.value; draw(); });
    draw();
  }

  /* ---------- Quote form → WhatsApp ---------- */
  const quote = $("#quote-form");
  if (quote) quote.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(quote);
    const msg = `Hi Carpenthree, I'd like a quote.\n\nName: ${f.get("name")}\nMobile: ${f.get("phone")}\nProperty: ${f.get("property")}\nService: ${f.get("service")}\nBudget: ${f.get("budget")}\n\nDetails: ${f.get("details")}`;
    window.open(waLink(msg), "_blank", "noopener");
  });

  /* ---------- Carpentry marquee: duplicate the list once for a seamless loop ---------- */
  // The list comes from SITE.carpentryTypes in js/config.js (falls back to the HTML list).
  const marquee = $("#marquee-list");
  if (marquee) {
    const types = (S.carpentryTypes || []).map((t) => String(t).trim()).filter(Boolean);
    if (types.length) marquee.innerHTML = types.map((t) => `<li>${esc(t)}</li>`).join("");
    $$("li", marquee).forEach((li) => {
      const copy = li.cloneNode(true); copy.setAttribute("aria-hidden", "true"); marquee.appendChild(copy);
    });
    const n = $$("li", marquee).length / 2;
    // Keep a steady reading speed however many items there are (40s ≈ 18 items)
    const secs = (S.scrollSeconds || 40) * Math.max(n, 4) / 18;
    marquee.style.animationDuration = `${secs}s`;
    // Tap or click to pause / resume
    const band = marquee.closest(".marquee");
    band.setAttribute("title", "Tap to pause");
    band.addEventListener("click", () => band.classList.toggle("paused"));
  }

  renderCart();
  initPhotos();
})();
