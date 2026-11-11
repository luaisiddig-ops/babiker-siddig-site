/* ============================================================
   Babiker Siddig — Artist Portfolio — main.js
   Navigation, language switch, gallery render, lightbox,
   inquiry modal, contact form, image protection.
   ============================================================ */
(function(){
  "use strict";

  /* ---------------- Language ---------------- */
  var LANG_KEY = "bs-lang";
  function applyLang(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    var arBtn = document.getElementById("langAr");
    var enBtn = document.getElementById("langEn");
    if (arBtn && enBtn){
      arBtn.classList.toggle("active", lang === "ar");
      enBtn.classList.toggle("active", lang === "en");
    }
    try { localStorage.setItem(LANG_KEY, lang); } catch(e){}
    updateGeneralWhatsappLinks(lang);
    if (window.renderGallery) window.renderGallery();
  }

  /* Tries the WhatsApp desktop/mobile app directly (whatsapp://) so desktop
     users with the app installed skip the wa.me landing page entirely; if
     nothing handles that protocol within ~1.2s (no app installed), falls
     back to the normal wa.me web link exactly as before. */
  function openWhatsAppSmart(number, text){
    var encoded = encodeURIComponent(text);
    var appUrl = "whatsapp://send?phone=" + number + "&text=" + encoded;
    var webUrl = "https://wa.me/" + number + "?text=" + encoded;
    var timer = setTimeout(function(){
      window.location.href = webUrl;
    }, 1200);
    function onBlur(){
      clearTimeout(timer);
      window.removeEventListener("blur", onBlur);
    }
    window.addEventListener("blur", onBlur);
    window.location.href = appUrl;
  }
  function wireSmartWhatsappLink(el, number, text){
    if (!el) return;
    el.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
    el.onclick = function(e){
      e.preventDefault();
      openWhatsAppSmart(number, text);
    };
  }

  function updateGeneralWhatsappLinks(lang){
    var text = lang === "ar"
      ? "مرحباً، أرغب في الاستفسار عن إحدى اللوحات المعروضة في الموقع."
      : "Hello, I'd like to enquire about one of the paintings on the website.";
    var pairs = [
      ["waCardUae", "971585410334"], ["waCardEgypt", "201143813563"],
      ["waFooterUae", "971585410334"], ["waFooterEgypt", "201143813563"]
    ];
    pairs.forEach(function(p){
      wireSmartWhatsappLink(document.getElementById(p[0]), p[1], text);
    });
  }
  function initLang(){
    var saved = "ar";
    try { saved = localStorage.getItem(LANG_KEY) || "ar"; } catch(e){}
    applyLang(saved);
    var arBtn = document.getElementById("langAr");
    var enBtn = document.getElementById("langEn");
    if (arBtn) arBtn.addEventListener("click", function(){ applyLang("ar"); });
    if (enBtn) enBtn.addEventListener("click", function(){ applyLang("en"); });
  }

  /* ---------------- Header scroll state ---------------- */
  function initHeaderScroll(){
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll(){
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else if (!header.classList.contains("is-scrolled") || window.scrollY <= 40){
        if (window.scrollY <= 40 && !header.classList.contains("force-solid")) header.classList.remove("is-scrolled");
      }
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  /* ---------------- Mobile nav ---------------- */
  function initNavToggle(){
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function(){
      nav.classList.toggle("is-open");
      toggle.textContent = nav.classList.contains("is-open") ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        nav.classList.remove("is-open");
        toggle.textContent = "☰";
      });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal(){
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)){
      items.forEach(function(el){ el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:"0px 0px -40px 0px" });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---------------- Animated counters ---------------- */
  function initCounters(){
    var items = document.querySelectorAll(".fact strong[data-count]");
    if (!items.length || !("IntersectionObserver" in window)) return;
    function animate(el){
      var target = parseInt(el.dataset.count, 10);
      var prefix = el.dataset.prefix || "";
      var start = performance.now();
      var duration = 1400;
      function tick(now){
        var p = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.6 });
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---------------- Back to top ---------------- */
  function initToTop(){
    var btn = document.getElementById("toTop");
    if (!btn) return;
    window.addEventListener("scroll", function(){
      btn.classList.toggle("is-visible", window.scrollY > 700);
    }, { passive:true });
    btn.addEventListener("click", function(){
      window.scrollTo({ top:0, behavior:"smooth" });
    });
  }

  /* ---------------- Hero slideshow ---------------- */
  function initHero(){
    var hero = document.getElementById("home");
    var slidesEl = document.getElementById("heroSlides");
    var dotsEl = document.getElementById("heroDots");
    if (!hero || !slidesEl || !dotsEl) return;
    var slides = Array.prototype.slice.call(slidesEl.querySelectorAll(".hero-slide"));
    if (!slides.length) return;

    var DURATION = 5500;
    var current = 0;
    var timer = null;

    slides.forEach(function(_, i){
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero-dot";
      dot.setAttribute("aria-label", "Slide " + (i + 1));
      dot.addEventListener("click", function(){
        goTo(i);
        restart();
      });
      dotsEl.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsEl.querySelectorAll(".hero-dot"));
    dots[0].classList.add("is-active");

    function goTo(i){
      slides[current].classList.remove("is-active");
      dots[current].classList.remove("is-active");
      current = i;
      slides[current].classList.add("is-active");
      dots[current].classList.add("is-active");
    }
    function next(){ goTo((current + 1) % slides.length); }
    function start(){ timer = setInterval(next, DURATION); }
    function stop(){ if (timer) clearInterval(timer); timer = null; }
    function restart(){ stop(); start(); }

    start();
    hero.addEventListener("mouseenter", function(){ hero.classList.add("is-paused"); stop(); });
    hero.addEventListener("mouseleave", function(){ hero.classList.remove("is-paused"); start(); });
  }

  /* ---------------- Toast ---------------- */
  var toastTimer = null;
  function showToast(msg){
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove("is-visible"); }, 2600);
  }

  /* ---------------- Image protection ---------------- */
  function initProtection(){
    var protectMsgAr = "الصور محمية بحقوق الملكية الفكرية — غير مصرح بتحميلها أو استخدامها دون إذن.";
    var protectMsgEn = "Images are copyright protected — downloading or reuse without permission is not authorised.";
    function msg(){ return document.documentElement.lang === "ar" ? protectMsgAr : protectMsgEn; }

    document.addEventListener("contextmenu", function(e){
      if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "VIDEO")){
        e.preventDefault();
        showToast(msg());
      }
    });
    document.addEventListener("dragstart", function(e){
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    });
    document.addEventListener("keydown", function(e){
      var k = e.key ? e.key.toLowerCase() : "";
      var blocked = (e.ctrlKey || e.metaKey) && (k === "s" || k === "u");
      if (blocked){
        e.preventDefault();
        showToast(msg());
      }
    });
  }

  /* ================================================================
     GALLERY
     ================================================================ */
  var state = { filter:"all", visible:18, step:18 };

  function uniqueArtworks(){
    var list = (window.ARTWORKS && window.ARTWORKS.artworks) || [];
    return list.filter(function(a){ return a.isPrimary !== false; });
  }

  function categoryLabel(cat, lang){
    var map = {
      all:       { ar:"الكل", en:"All" },
      landscape: { ar:"مناظر طبيعية", en:"Landscape" },
      portrait:  { ar:"بورتريه", en:"Portrait" },
      abstract:  { ar:"تجريدي", en:"Abstract" },
      ink:       { ar:"رسم بالحبر", en:"Ink Drawing" },
      figurative:{ ar:"تكوينات إنسانية", en:"Figurative" },
      "still-life": { ar:"طبيعة صامتة", en:"Still Life" }
    };
    var entry = map[cat] || { ar:cat, en:cat };
    return entry[lang] || entry.en;
  }

  function priceLineHtml(a, lang){
    if (!a.price_min_usd) return "";
    var txt = lang === "ar"
      ? ("تبدأ من $" + a.price_min_usd + " — $" + a.price_max_usd)
      : ("From $" + a.price_min_usd + " – $" + a.price_max_usd);
    return '<div class="art-price">' + txt + '</div>';
  }

  function dimsLineHtml(a, lang){
    if (!a.size_cm) return "";
    var medium = lang === "ar" ? a.medium_ar : a.medium_en;
    var sizeTxt = lang === "ar" ? (a.size_cm + " سم") : (a.size_cm + " cm");
    return sizeTxt + (medium ? " — " + medium : "");
  }

  function buildFilters(){
    var row = document.getElementById("filterRow");
    if (!row) return;
    var items = uniqueArtworks();
    var cats = {};
    items.forEach(function(a){ cats[a.category] = (cats[a.category]||0) + 1; });
    var order = ["all","landscape","portrait","figurative","abstract","ink","still-life"];
    row.innerHTML = "";
    order.forEach(function(cat){
      if (cat !== "all" && !cats[cat]) return;
      var btn = document.createElement("button");
      btn.className = "filter-pill" + (state.filter === cat ? " active" : "");
      btn.type = "button";
      btn.dataset.cat = cat;
      btn.textContent = categoryLabel(cat, document.documentElement.lang);
      btn.addEventListener("click", function(){
        state.filter = cat;
        state.visible = state.step;
        renderGallery();
      });
      row.appendChild(btn);
    });
  }

  function renderGallery(){
    var grid = document.getElementById("galleryGrid");
    var countEl = document.getElementById("galleryCount");
    var loadMoreBtn = document.getElementById("loadMoreBtn");
    if (!grid) return;
    buildFilters();

    var lang = document.documentElement.lang === "ar" ? "ar" : "en";
    var all = uniqueArtworks();
    var filtered = state.filter === "all" ? all : all.filter(function(a){ return a.category === state.filter; });
    var toShow = filtered.slice(0, state.visible);

    grid.innerHTML = "";
    toShow.forEach(function(a){
      var card = document.createElement("div");
      card.className = "art-card";
      card.dataset.id = a.id;

      var frame = document.createElement("div");
      frame.className = "frame";

      var img = document.createElement("img");
      img.src = "assets/images/thumb/" + a.id + ".jpg";
      img.alt = lang === "ar" ? a.alt_ar : a.alt_en;
      img.loading = "lazy";
      img.draggable = false;
      frame.appendChild(img);

      var overlay = document.createElement("div");
      overlay.className = "art-overlay";
      overlay.innerHTML =
        '<div class="art-cat">' + categoryLabel(a.category, lang) + '</div>' +
        '<div class="art-actions">' +
          '<button type="button" class="view">' + (lang === "ar" ? "عرض" : "View") + '</button>' +
          '<button type="button" class="inquire">' + (lang === "ar" ? "استفسار" : "Enquire") + '</button>' +
        '</div>';
      frame.appendChild(overlay);
      card.appendChild(frame);

      var caption = document.createElement("div");
      caption.className = "art-caption";
      caption.innerHTML =
        '<div class="art-caption-title">' + (lang === "ar" ? a.title_ar : a.title_en) + '</div>' +
        '<div class="art-caption-meta">' +
          '<span class="art-caption-ref">' + a.id.toUpperCase() + '</span>' +
          priceLineHtml(a, lang) +
        '</div>';
      card.appendChild(caption);

      card.addEventListener("click", function(e){
        if (e.target && e.target.classList.contains("inquire")){
          openInquiry(a);
        } else {
          openLightbox(a.id);
        }
      });

      grid.appendChild(card);
    });

    if (countEl){
      var tpl = lang === "ar"
        ? ("عرض " + toShow.length + " من " + filtered.length + " لوحة")
        : ("Showing " + toShow.length + " of " + filtered.length + " works");
      countEl.textContent = tpl;
    }
    if (loadMoreBtn) loadMoreBtn.style.display = (toShow.length >= filtered.length) ? "none" : "inline-flex";

    populateArtworkSelect(all, lang);
  }
  window.renderGallery = renderGallery;

  function populateArtworkSelect(all, lang){
    var sel = document.getElementById("fArtwork");
    if (!sel) return;
    var current = sel.value;
    var defaultOpt = document.getElementById("fArtworkDefault");
    if (defaultOpt) defaultOpt.textContent = lang === "ar" ? "استفسار عام" : "General Enquiry";
    while (sel.options.length > 1) sel.remove(1);
    all.forEach(function(a){
      var opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.id.toUpperCase() + " — " + (lang === "ar" ? a.title_ar : a.title_en);
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  }

  function initLoadMore(){
    var btn = document.getElementById("loadMoreBtn");
    if (!btn) return;
    btn.addEventListener("click", function(){
      state.visible += state.step;
      renderGallery();
    });
  }

  /* ================================================================
     LIGHTBOX
     ================================================================ */
  var lbIndex = -1, lbList = [];

  function openLightbox(id){
    lbList = uniqueArtworks();
    lbIndex = lbList.findIndex(function(a){ return a.id === id; });
    if (lbIndex < 0) return;
    renderLightbox();
    document.getElementById("lightbox").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox(){
    document.getElementById("lightbox").classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function renderLightbox(){
    var a = lbList[lbIndex];
    if (!a) return;
    var lang = document.documentElement.lang === "ar" ? "ar" : "en";
    document.getElementById("lightboxImg").src = "assets/images/web/" + a.id + ".jpg";
    document.getElementById("lightboxImg").alt = lang === "ar" ? a.alt_ar : a.alt_en;
    document.getElementById("lightboxRef").textContent = a.id.toUpperCase();
    document.getElementById("lightboxTitle").textContent = lang === "ar" ? a.title_ar : a.title_en;
    document.getElementById("lightboxCat").textContent = categoryLabel(a.category, lang);
    document.getElementById("lightboxDims").textContent = dimsLineHtml(a, lang);
    document.getElementById("lightboxPrice").innerHTML = priceLineHtml(a, lang);
    document.getElementById("lightboxAlt").textContent = lang === "ar" ? a.alt_ar : a.alt_en;
    document.getElementById("lightboxInquire").onclick = function(){ openInquiry(a); };
  }
  function initLightbox(){
    document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
    document.getElementById("lightbox").addEventListener("click", function(e){
      if (e.target.id === "lightbox") closeLightbox();
    });
    document.getElementById("lightboxPrev").addEventListener("click", function(){
      lbIndex = (lbIndex - 1 + lbList.length) % lbList.length; renderLightbox();
    });
    document.getElementById("lightboxNext").addEventListener("click", function(){
      lbIndex = (lbIndex + 1) % lbList.length; renderLightbox();
    });
    document.addEventListener("keydown", function(e){
      if (!document.getElementById("lightbox").classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") document.getElementById("lightboxNext").click();
      if (e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
    });
  }

  /* ================================================================
     INQUIRY MODAL
     ================================================================ */
  var WHATSAPP_NUMBERS = ["971585410334", "201143813563"];
  var EMAIL = "luaisiddig@gmail.com,Babikersiddig11@gmail.com";

  function openInquiry(a){
    var lang = document.documentElement.lang === "ar" ? "ar" : "en";
    document.getElementById("modalThumb").src = "assets/images/thumb/" + a.id + ".jpg";
    document.getElementById("modalThumb").alt = lang === "ar" ? a.alt_ar : a.alt_en;
    document.getElementById("modalRef").textContent = a.id.toUpperCase();
    document.getElementById("modalTitle").textContent = lang === "ar" ? a.title_ar : a.title_en;
    var modalDimsEl = document.getElementById("modalDims");
    if (modalDimsEl) modalDimsEl.textContent = dimsLineHtml(a, lang);
    var modalPriceEl = document.getElementById("modalPrice");
    if (modalPriceEl) modalPriceEl.innerHTML = priceLineHtml(a, lang);

    var priceNote = a.price_min_usd
      ? (lang === "ar" ? (" السعر المبدئي المعروض: $" + a.price_min_usd + "–$" + a.price_max_usd + ".") : (" Listed starting price: $" + a.price_min_usd + "–$" + a.price_max_usd + "."))
      : "";
    var dimsNote = a.size_cm
      ? (lang === "ar" ? (" المقاس: " + dimsLineHtml(a, lang) + ".") : (" Size: " + dimsLineHtml(a, lang) + "."))
      : "";
    var text = lang === "ar"
      ? ("مرحباً، أرغب في الاستفسار عن اللوحة " + a.id.toUpperCase() + " (" + a.title_ar + ")." + dimsNote + priceNote + " هل هي متاحة للاقتناء؟")
      : ("Hello, I'd like to enquire about the painting " + a.id.toUpperCase() + " (" + a.title_en + ")." + dimsNote + priceNote + " Is it available for acquisition?");

    wireSmartWhatsappLink(document.getElementById("modalWhatsappUae"), WHATSAPP_NUMBERS[0], text);
    wireSmartWhatsappLink(document.getElementById("modalWhatsappEgypt"), WHATSAPP_NUMBERS[1], text);
    document.getElementById("modalEmail").onclick = function(){
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("استفسار عن لوحة " + a.id.toUpperCase() + " / Enquiry: " + a.id.toUpperCase()) + "&body=" + encodeURIComponent(text);
    };

    var sel = document.getElementById("fArtwork");
    if (sel) sel.value = a.id;

    document.getElementById("inquiryModal").classList.add("is-open");
  }
  function closeInquiry(){
    document.getElementById("inquiryModal").classList.remove("is-open");
  }
  function initInquiryModal(){
    var modal = document.getElementById("inquiryModal");
    if (!modal) return;
    document.getElementById("modalClose").addEventListener("click", closeInquiry);
    modal.addEventListener("click", function(e){ if (e.target.id === "inquiryModal") closeInquiry(); });
  }

  /* ================================================================
     CONTACT FORM
     ================================================================ */
  function initContactForm(){
    var form = document.getElementById("inquiryForm");
    if (!form) return;
    var waBtnUae = document.getElementById("sendWhatsappUae");
    var waBtnEgypt = document.getElementById("sendWhatsappEgypt");
    var emailBtn = document.getElementById("sendEmail");

    function buildMessage(lang){
      var name = document.getElementById("fName").value.trim();
      var email = document.getElementById("fEmail").value.trim();
      var phone = document.getElementById("fPhone").value.trim();
      var artworkSel = document.getElementById("fArtwork");
      var artworkLabel = artworkSel.options[artworkSel.selectedIndex] ? artworkSel.options[artworkSel.selectedIndex].textContent : "";
      var message = document.getElementById("fMessage").value.trim();

      if (lang === "ar"){
        var lines = ["الاسم: " + name, "البريد: " + email];
        if (phone) lines.push("الهاتف: " + phone);
        if (artworkSel.value) lines.push("اللوحة: " + artworkLabel);
        lines.push("الرسالة: " + message);
        return lines.join("\n");
      } else {
        var linesE = ["Name: " + name, "Email: " + email];
        if (phone) linesE.push("Phone: " + phone);
        if (artworkSel.value) linesE.push("Artwork: " + artworkLabel);
        linesE.push("Message: " + message);
        return linesE.join("\n");
      }
    }

    function validate(){
      return form.reportValidity ? form.reportValidity() : true;
    }

    if (waBtnUae) waBtnUae.addEventListener("click", function(){
      if (!validate()) return;
      var lang = document.documentElement.lang === "ar" ? "ar" : "en";
      var text = buildMessage(lang);
      openWhatsAppSmart(WHATSAPP_NUMBERS[0], text);
    });
    if (waBtnEgypt) waBtnEgypt.addEventListener("click", function(){
      if (!validate()) return;
      var lang = document.documentElement.lang === "ar" ? "ar" : "en";
      var text = buildMessage(lang);
      openWhatsAppSmart(WHATSAPP_NUMBERS[1], text);
    });
    if (emailBtn) emailBtn.addEventListener("click", function(){
      if (!validate()) return;
      var lang = document.documentElement.lang === "ar" ? "ar" : "en";
      var text = buildMessage(lang);
      var subject = lang === "ar" ? "استفسار من الموقع" : "Website Enquiry";
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    });
  }

  /* ---------------- Film player ---------------- */
  function initFilm(){
    var video = document.getElementById("filmVideo");
    var playBtn = document.getElementById("filmPlayBtn");
    var player = document.querySelector(".film-player");
    if (!video || !playBtn) return;
    playBtn.addEventListener("click", function(){ video.play().catch(function(){}); });
    video.addEventListener("play", function(){ playBtn.classList.add("is-hidden"); });
    video.addEventListener("pause", function(){ playBtn.classList.remove("is-hidden"); });
    video.addEventListener("ended", function(){ playBtn.classList.remove("is-hidden"); });
    video.addEventListener("error", function(){
      if (player) player.classList.add("film-unavailable");
    }, true);
  }

  /* ---------------- Footer year ---------------- */
  function initYear(){
    var y = new Date().getFullYear();
    var a = document.getElementById("yearAr");
    var b = document.getElementById("yearEn");
    if (a) a.textContent = y;
    if (b) b.textContent = y;
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function(){
    initLang();
    initHeaderScroll();
    initNavToggle();
    initHero();
    initReveal();
    initCounters();
    initToTop();
    initProtection();
    initLightbox();
    initInquiryModal();
    initContactForm();
    initFilm();
    initLoadMore();
    initYear();
    if (document.getElementById("galleryGrid")) renderGallery();
  });
})();
