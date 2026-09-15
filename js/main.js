(() => {
  "use strict";
  const state = {
    user: null,
    cart: { items: [], subtotal: 0, discount: 0, total: 0, itemCount: 0 },
    wishlist: [],
    selectedProduct: null,
    branchId: null,
    pickupMethod: "delivery",
    paymentMethod: "cod",
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => `${Number(n || 0).toFixed(0)} EGP`;
  const API_BASE_URL = window.__API_BASE_URL__ || "/api";
  async function api(path, opts = {}) {
    const r = await fetch(API_BASE_URL + path, {
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });

    function toast(msg) {
      if (window.showToast) window.showToast(msg);
      else alert(msg);
    }
    function loginGuard() {
      if (!state.user) {
        toast("سجّل الدخول أولاً");
        window.goTo("login");
        return false;
      }
      return true;
    }
    async function refresh() {
      const me = await api("/auth/me");
      state.user = me.user;
      if (state.user) {
        const [cart, wish] = await Promise.all([
          api("/cart").catch(() => ({
            items: [],
            subtotal: 0,
            discount: 0,
            total: 0,
            itemCount: 0,
          })),
          api("/wishlist").catch(() => ({ items: [] })),
        ]);
        state.cart = cart;
        state.wishlist = (wish.items || []).map((x) => Number(x.product_id));
      } else {
        state.cart = {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
        };
        state.wishlist = [];
      }
      updateHeader();
      renderCart();
      renderWishlist();
      renderAccount();
      renderHeartStates();
    }
    function updateHeader() {
      const logged = !!state.user;
      $$("[data-shop-header]").forEach(
        (h) =>
          (h.innerHTML = `<div class="inner"><a class="logo" href="#" onclick="goTo('home');return false"><span class="logo-badge"><img class="logo-img" data-logo-src alt="Dev-X Book Store"></span></a><nav class="header-links"><a onclick="goTo('books')">الكتب</a><a onclick="goTo('categories')">الأقسام</a><a onclick="goTo('offers')">العروض</a></nav><div class="header-icons"><button class="icon-btn" title="المفضلة" onclick="goTo('wishlist')">♥<span class="badge-dot" id="wishBadge">${state.wishlist.length}</span></button><button class="icon-btn" title="السلة" onclick="goTo('cart')">🛒<span class="badge-dot" id="cartBadge">${state.cart.itemCount || 0}</span></button><button class="btn" style="background:rgba(255,255,255,.08);color:#fff" onclick="${logged ? "logout()" : "goTo('login')"}">${logged ? "خروج" : "دخول"}</button></div></div>`),
      );
      $$("[data-logo-src]").forEach((i) => {
        if (window.LOGO_SRC) i.src = window.LOGO_SRC;
      });
    }
    window.updateBadges = () => {
      const c = $("#cartBadge"),
        w = $("#wishBadge");
      if (c) c.textContent = state.cart.itemCount || 0;
      if (w) w.textContent = state.wishlist.length;
    };
    window.openProductById = async (id) => {
      try {
        const d = await api("/products/" + id);
        state.selectedProduct = d.product;
        renderProduct(d.product);
        window.goTo("product");
      } catch (e) {
        toast(e.message);
      }
    };
    window.openProductByImage = async (key) => {
      try {
        const d = await api(
          "/products/by-image-key/" + encodeURIComponent(key),
        );
        state.selectedProduct = d.product;
        renderProduct(d.product);
        window.goTo("product");
      } catch (e) {
        toast(e.message);
      }
    };
    function renderProduct(p) {
      const page = $("#page-product");
      if (!page || !p) return;
      const img = p.image_key && window.PRODUCT_IMAGES?.[p.image_key];
      const title = page.querySelector("h1,h2,.section-title");
      if (title) title.textContent = p.name;
      const all = [...page.querySelectorAll(".p-price b")];
      all.forEach((x) => (x.textContent = money(p.price)));
      const images = page.querySelectorAll(".thumb-img");
      if (images.length && img) images.forEach((x) => (x.src = img));
      const desc = [...page.querySelectorAll("p,.section-sub")].find((x) =>
        /وصف|كتاب|متاح|Pre-Order/.test(x.textContent || ""),
      );
      if (desc)
        desc.textContent = p.description || "منتج متاح من Dev-X Book Store";
      const btn = [...page.querySelectorAll("button,.btn")].find((x) =>
        /السلة|إضافة/.test(x.textContent || ""),
      );
      if (btn) {
        btn.onclick = () => window.addProductToCart(p.id);
      }
    }
    window.addProductToCart = async function (id) {
      if (!loginGuard()) return;
      try {
        state.cart = await api("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: id, quantity: 1 }),
        });
        updateHeader();
        renderCart();
        toast("تمت الإضافة إلى السلة");
      } catch (e) {
        toast(e.message);
      }
    };
    window.addToCart = async function (event) {
      if (event) event.stopPropagation();
      let card = event?.currentTarget?.closest(".p-card");
      let key = card?.querySelector("[data-img]")?.dataset.img;
      if (!key) key = state.selectedProduct?.image_key;
      return key ? openProductByImageAndAdd(key) : toast("اختر منتجاً أولاً");
    };
    async function openProductByImageAndAdd(key) {
      try {
        const d = await api(
          "/products/by-image-key/" + encodeURIComponent(key),
        );
        await window.addProductToCart(d.product.id);
      } catch (e) {
        toast(e.message);
      }
    }
    function renderCart() {
      const page = $("#page-cart");
      if (!page) return;
      const sub = [...page.querySelectorAll(".section-sub")][0];
      if (sub) sub.textContent = `${state.cart.itemCount || 0} منتجات`;
      const itemsHost = page.querySelector(".cart-layout>div:first-child");
      if (itemsHost) {
        itemsHost.innerHTML = state.cart.items.length
          ? state.cart.items
              .map(
                (x) =>
                  `<div class="cart-item" data-item="${x.item_id}"><div class="thumb">${x.image_key && window.PRODUCT_IMAGES?.[x.image_key] ? `<img class="thumb-img" src="${window.PRODUCT_IMAGES[x.image_key]}" alt="${x.name}">` : "🛍️"}</div><div class="info"><b>${escapeHtml(x.name)}</b><span>الكمية: <button onclick="changeQty(${x.item_id},${x.quantity - 1})" ${x.quantity <= 1 ? "disabled" : ""}>−</button> ${x.quantity} <button onclick="changeQty(${x.item_id},${x.quantity + 1})">+</button></span><a class="remove-x" onclick="removeCartItem(${x.item_id})">إزالة</a></div><div class="price">${money(x.line_total)}</div></div>`,
              )
              .join("")
          : '<div class="empty-state"><b>السلة فاضية</b><span>ابدأ بإضافة منتجات من المتجر.</span></div>';
      }
      const nums = page.querySelectorAll(".summary-row span:last-child");
      if (nums.length >= 3) {
        nums[0].textContent = money(state.cart.subtotal);
        nums[1].textContent = money(state.cart.discount);
        nums[2].textContent = money(state.cart.total);
      }
      const box = page.querySelector(".discount-bar-box span");
      if (box)
        box.textContent = `إجمالي الأوردر: ${money(state.cart.subtotal)}`;
      updateHeader();
    }
    window.changeQty = async (id, q) => {
      if (q < 1) return;
      try {
        state.cart = await api("/cart/items/" + id, {
          method: "PATCH",
          body: JSON.stringify({ quantity: q }),
        });
        renderCart();
        updateHeader();
      } catch (e) {
        toast(e.message);
      }
    };
    window.removeCartItem = async (id) => {
      try {
        state.cart = await api("/cart/items/" + id, { method: "DELETE" });
        renderCart();
        updateHeader();
        toast("تم حذف المنتج");
      } catch (e) {
        toast(e.message);
      }
    };
    function renderWishlist() {
      const page = $("#page-wishlist");
      if (!page) return;
      const grid = page.querySelector(".grid-products");
      if (!grid) return;
      if (!state.wishlist.length) {
        grid.innerHTML =
          '<div class="empty-state"><b>المفضلة فاضية</b><span>احفظ المنتجات اللي عايز ترجع لها بعدين.</span></div>';
        return;
      }
      Promise.all(state.wishlist.map((id) => api("/products/" + id)))
        .then((ds) => {
          grid.innerHTML = ds
            .map(
              ({ product: p }) =>
                `<div class="p-card wish-card"><div class="heart" onclick="toggleWish(${p.id})">♥</div><div class="p-thumb"><img class="thumb-img" src="${window.PRODUCT_IMAGES?.[p.image_key] || ""}" alt="${escapeHtml(p.name)}"></div><div class="p-body"><b>${escapeHtml(p.name)}</b><span class="p-meta">${escapeHtml(p.category || "منتج")}</span><div class="p-price"><b>${money(p.price)}</b><span class="add-mini" onclick="addProductToCart(${p.id});event.stopPropagation()">+</span></div></div></div>`,
            )
            .join("");
        })
        .catch(() => {});
    }
    async function productIdByImageKey(key) {
      const d = await api("/products/by-image-key/" + encodeURIComponent(key));
      return Number(d.product.id);
    }
    window.toggleWishByImage = async function (key, element) {
      if (!loginGuard()) return;
      try {
        const id = await productIdByImageKey(key);
        await window.toggleWish(id);
        if (element)
          element.classList.toggle("active", state.wishlist.includes(id));
      } catch (e) {
        toast(e.message);
      }
    };
    function renderHeartStates() {
      $$(".p-card .heart").forEach((h) => {
        const card = h.closest(".p-card");
        const img = card?.querySelector("[data-img]");
        if (!img) return;
        h.dataset.imageKey = img.dataset.img || "";
        let id = null;
        // Static cards use image keys; resolve state by looking at already-rendered wishlist cards when possible.
        h.classList.remove("active");
        const key = h.dataset.imageKey;
        if (state.wishlist.length && key) {
          api("/products/by-image-key/" + encodeURIComponent(key))
            .then((d) => {
              if (state.wishlist.includes(Number(d.product.id)))
                h.classList.add("active");
            })
            .catch(() => {});
        }
      });
    }
    window.toggleWish = async (id) => {
      if (!loginGuard()) return;
      try {
        if (state.wishlist.includes(id)) {
          await api("/wishlist/" + id, { method: "DELETE" });
          state.wishlist = state.wishlist.filter((x) => x !== id);
          toast("تمت الإزالة من المفضلة");
        } else {
          await api("/wishlist", {
            method: "POST",
            body: JSON.stringify({ productId: id }),
          });
          state.wishlist.push(id);
          toast("تمت الإضافة للمفضلة");
        }
        renderWishlist();
        updateHeader();
      } catch (e) {
        toast(e.message);
      }
    };
    function renderAccount() {
      const page = $("#page-account");
      if (!page || !state.user) return;
      const title = page.querySelector(".section-title");
      if (title) title.textContent = `أهلاً ${state.user.name}`;
      const stat = page.querySelectorAll(".stat-card b");
      api("/account")
        .then((d) => {
          if (stat[0]) stat[0].textContent = d.stats.orders;
          if (stat[1]) stat[1].textContent = d.stats.wishlist;
          if (stat[2]) stat[2].textContent = d.stats.items;
        })
        .catch(() => {});
    }
    function renderOrders() {
      if (!loginGuard()) return;
      api("/orders")
        .then((d) => {
          const page = $("#page-orders");
          if (!page) return;
          const rows = page.querySelectorAll(".order-row");
          if (rows.length) {
            rows.forEach((r) => r.remove());
          }
          const wrap = page.querySelector(".wrap");
          (d.orders || []).forEach((o) => {
            const row = document.createElement("div");
            row.className = "order-row";
            row.innerHTML = `<div class="l"><b>${o.order_number}</b><span>${new Date(o.created_at).toLocaleDateString("ar-EG")} — ${money(o.total)}</span></div><span class="status-chip status-transit">${o.status === "pending" ? "قيد المعالجة" : o.status}</span>`;
            wrap.appendChild(row);
          });
        })
        .catch((e) => toast(e.message));
    }
    window.logout = async () => {
      await api("/auth/logout", { method: "POST" });
      state.user = null;
      state.cart = {
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
      };
      state.wishlist = [];
      updateHeader();
      toast("تم تسجيل الخروج");
      goTo("login");
    };
    function escapeHtml(s) {
      return String(s ?? "").replace(
        /[&<>'"]/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;",
          })[c],
      );
    }
    const oldGo = window.goTo;
    window.goTo = async function (id) {
      if (
        [
          "account",
          "orders",
          "wishlist",
          "checkout",
          "branches",
          "payment",
        ].includes(id) &&
        !state.user
      ) {
        toast("سجّل الدخول أولاً");
        return oldGo("login");
      }
      oldGo(id);
      if (id === "orders") renderOrders();
      if (id === "account") renderAccount();
      if (id === "cart") renderCart();
      if (id === "wishlist") renderWishlist();
      if (id === "branches") loadBranches();
    };
    async function loadBranches() {
      const d = await api("/branches");
      const host = $("#branchList");
      if (!host) return;
      host.innerHTML = "";
      (d.branches || []).forEach((b) => {
        const row = document.createElement("div");
        row.className = "order-row";
        row.dataset.branch = String(b.id);
        const left = document.createElement("div");
        left.className = "l";
        const name = document.createElement("b");
        name.textContent = b.name || "";
        const meta = document.createElement("span");
        meta.textContent = `${b.area || ""} — ${b.governorate || ""}`;
        left.append(name, meta);
        const choose = document.createElement("span");
        choose.textContent = "اختيار";
        row.append(left, choose);
        row.addEventListener("click", () =>
          window.selectBranch(row, b.name || "", Number(b.id)),
        );
        host.appendChild(row);
      });
    }
    window.selectBranch = function (el, name, id) {
      $$("#branchList .order-row").forEach(
        (r) => (r.style.borderColor = "var(--line)"),
      );
      el.style.borderColor = "var(--navy)";
      state.branchId = id;
      $("#selectedBranchName").textContent = name;
      $("#selectedBranchBar").style.display = "flex";
      toast("تم اختيار " + name);
    };
    window.goToCheckoutNext = function () {
      state.pickupMethod = $("#pickupMethod")?.value || "delivery";
      if (state.pickupMethod === "branch") goTo("branches");
      else goTo("payment");
    };
    // Auth buttons: replace prototype click handlers with real API calls.
    const loginBtn = $("#page-login .auth-card .btn-primary");
    if (loginBtn)
      loginBtn.onclick = async () => {
        if (loginBtn.disabled) return;
        loginBtn.disabled = true;
        loginBtn.setAttribute("aria-busy", "true");
        try {
          const email = $("#login-email-input")?.value?.trim() || "";
          const phone = $("#login-phone-input")?.value?.trim() || "";
          const pass = $("#login-password-input")?.value || "";
          const identifier = email || phone;
          if (!identifier || !pass) throw Error("أدخل بيانات الدخول");
          const d = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({ identifier, password: pass }),
          });
          state.user = d.user;
          await refresh();
          toast("تم تسجيل الدخول بنجاح");
          oldGo("home");
        } catch (e) {
          toast(e.message);
        } finally {
          loginBtn.disabled = false;
          loginBtn.removeAttribute("aria-busy");
        }
      };
    const signupBtn = $("#page-signup .auth-card .btn-primary");
    if (signupBtn)
      signupBtn.onclick = async () => {
        if (signupBtn.disabled) return;
        signupBtn.disabled = true;
        signupBtn.setAttribute("aria-busy", "true");
        try {
          const name = $("#signup-name-input")?.value?.trim() || "";
          const email = $("#signup-email-input")?.value?.trim() || "";
          const phone = $("#signup-phone-input")?.value?.trim() || "";
          const password = $("#signup-password-input")?.value || "";
          if (!name || (!email && !phone) || !password)
            throw Error("أكمل بيانات الحساب");
          const d = await api("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, phone, password }),
          });
          state.user = d.user;
          await refresh();
          toast("تم إنشاء الحساب بنجاح");
          oldGo("home");
        } catch (e) {
          toast(e.message);
        } finally {
          signupBtn.disabled = false;
          signupBtn.removeAttribute("aria-busy");
        }
      };
    // Password reset flow. Email delivery is intentionally provider-agnostic; local/test mode exposes a one-time token.
    const resetEmailField = $("#page-forgot-password input");
    const forgotBtn = $("#page-forgot-password .btn-primary");
    if (forgotBtn)
      forgotBtn.onclick = async () => {
        try {
          const identifier = resetEmailField?.value?.trim() || "";
          const d = await api("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ identifier }),
          });
          if (d.resetUrl) {
            window.history.replaceState({}, "", d.resetUrl);
            const token = d.resetToken;
            const input = $("#reset-password-token");
            if (input) input.value = token;
            goTo("reset-password");
            toast("تم إنشاء رابط إعادة التعيين للاختبار المحلي.");
          } else toast(d.message || "تم إرسال الطلب");
        } catch (e) {
          toast(e.message);
        }
      };
    const resetBtn = $("#page-reset-password .btn-primary");
    if (resetBtn)
      resetBtn.onclick = async () => {
        try {
          const token =
            $("#reset-password-token")?.value?.trim() ||
            new URLSearchParams(location.search).get("resetToken") ||
            "";
          const password = $("#reset-password-new")?.value || "";
          const confirm = $("#reset-password-confirm")?.value || "";
          if (password !== confirm) throw Error("تأكيد كلمة المرور غير مطابق");
          const d = await api("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
          });
          toast(d.message);
          history.replaceState({}, "", location.pathname);
          goTo("login");
        } catch (e) {
          toast(e.message);
        }
      };
    const resetTokenFromUrl = new URLSearchParams(location.search).get(
      "resetToken",
    );
    if (resetTokenFromUrl) {
      const input = $("#reset-password-token");
      if (input) input.value = resetTokenFromUrl;
      setTimeout(() => goTo("reset-password"), 0);
    }

    // Checkout / payment -> create real order.
    const payBtn = $("#page-payment .btn-primary");
    let checkoutSubmitting = false;
    if (payBtn)
      payBtn.onclick = async () => {
        if (!loginGuard() || checkoutSubmitting) return;
        checkoutSubmitting = true;
        payBtn.disabled = true;
        payBtn.setAttribute("aria-busy", "true");
        try {
          const addressInputs = $$("#page-checkout .field input");
          const select = $("#page-checkout .field select");
          const address = {
            fullName: addressInputs[0]?.value || state.user.name,
            phone: addressInputs[1]?.value || state.user.phone || "",
            governorate: select?.value || "القاهرة",
            details: addressInputs[2]?.value || "",
          };
          const payment = state.paymentMethod;
          const d = await api("/orders", {
            method: "POST",
            body: JSON.stringify({
              address,
              pickupMethod: state.pickupMethod,
              branchId: state.branchId,
              paymentMethod: payment,
            }),
          });
          if (d.order?.paymentRequired && d.order?.paymentUrl) {
            window.location.href = d.order.paymentUrl;
            return;
          }
          state.cart = await api("/cart");
          updateHeader();
          const success = $("#page-success");
          const txt = success?.querySelector(".section-sub");
          if (txt)
            txt.textContent = `تم إنشاء طلبك ${d.order.orderNumber} بإجمالي ${money(d.order.total)}`;
          oldGo("success");
        } catch (e) {
          toast(e.message);
        } finally {
          checkoutSubmitting = false;
          payBtn.disabled = false;
          payBtn.removeAttribute("aria-busy");
        }
      };
    $$("#page-payment .pay-option").forEach(
      (x, i) =>
        (x.onclick = () => {
          $$("#page-payment .pay-option").forEach((y) =>
            y.classList.remove("selected"),
          );
          x.classList.add("selected");
          state.paymentMethod = ["card", "cod", "wallet"][i] || "cod";
        }),
    );
    // Intercept product cards and add wishlist heart behavior.
    document.addEventListener(
      "click",
      (e) => {
        const heart = e.target.closest(".heart");
        if (heart) {
          const card = heart.closest(".p-card");
          const img = card?.querySelector("[data-img]");
          if (img) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleWishByImage(img.dataset.img, heart);
          }
          return;
        }
        const card = e.target.closest(".p-card");
        if (!card || e.target.closest(".add-mini")) return;
        const img = card.querySelector("[data-img]");
        if (img) {
          e.preventDefault();
          openProductByImage(img.dataset.img);
        }
      },
      true,
    );

    // Replace the original static demo search with the real Products API.
    let searchTimer = null;
    window.runSearch = async function (q) {
      const results = $("#searchResults"),
        empty = $("#searchEmpty");
      if (!results || !empty) return;
      clearTimeout(searchTimer);
      const query = String(q || "").trim();
      if (!query) {
        results.innerHTML = "";
        empty.style.display = "none";
        return;
      }
      searchTimer = setTimeout(async () => {
        try {
          const d = await api("/products?q=" + encodeURIComponent(query));
          const products = d.products || [];
          if (!products.length) {
            results.innerHTML = "";
            empty.style.display = "block";
            return;
          }
          empty.style.display = "none";
          results.innerHTML = products
            .map(
              (
                p,
              ) => `<div class="p-card" data-product-id="${p.id}" onclick="openProductById(${p.id})">
          <div class="p-thumb"><img class="thumb-img" src="${window.PRODUCT_IMAGES?.[p.image_key] || ""}" alt="${escapeHtml(p.name)}"></div>
          <div class="p-body"><b>${escapeHtml(p.name)}</b><span class="p-meta">${escapeHtml(p.category || "")}</span>
          <div class="p-price"><b>${money(p.price)}</b><span class="add-mini" onclick="event.stopPropagation();addProductToCart(${p.id})">+</span></div></div>
        </div>`,
            )
            .join("");
        } catch (e) {
          results.innerHTML = "";
          empty.style.display = "block";
          toast(e.message);
        }
      }, 150);
    };

    refresh().catch(() => updateHeader());
  }
})();
