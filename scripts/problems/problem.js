// Problem-page logic, inlined at the end of <body> by scripts/problems.mjs.
// DV: p = problem slug, v = "solo" | "stack", cal = cal.com booking URL, demo = prototype URL.
(function (DV) {
  var d = document;
  var $ = function (id) {
    return d.getElementById(id);
  };
  var pad = function (n) {
    return (n < 10 ? "0" : "") + n;
  };

  var q = new URLSearchParams(location.search);
  // ?c=Company → headline, booking-link UTM, form. textContent only, 40 chars max.
  var c = (q.get("c") || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  // Links that carry their own UTM tags (e.g. from /work) keep them; cold email is the default.
  var utm = q.get("utm_source")
    ? ["source", "medium", "campaign", "content"]
        .map(function (k) {
          return "utm_" + k + "=" + encodeURIComponent((q.get("utm_" + k) || "").slice(0, 80));
        })
        .join("&")
    : "utm_source=coldemail&utm_campaign=" + DV.p + "&utm_content=" + DV.v;
  var book = DV.cal + "?" + utm + (c ? "&utm_term=" + encodeURIComponent(c) : "");
  window.DV_BOOK = book; // used by the intake "Schedule a call" button
  d.querySelectorAll("[data-book]").forEach(function (a) {
    a.href = book;
  });
  if (c) {
    $("co").textContent = c + ", ";
    $("co").hidden = false;
    $("field-company").value = c;
    $("field-subject").value =
      "deltaV — New lead (" + DV.p + " / " + c + ")";
  }

  // Demo frame: cycle screens; images 2..n load after the page has loaded
  var f = $("frame");
  var imgs = f.querySelectorAll(".frame-screen img");
  var pips = f.querySelectorAll(".frame-pips button");
  var bar = f.querySelector(".frame-progress i");
  var n = imgs.length;
  var cur = 0;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function load(i) {
    var m = imgs[i];
    if (m.dataset.src) {
      m.src = m.dataset.src;
      m.removeAttribute("data-src");
    }
  }
  function run() {
    bar.classList.remove("run");
    void bar.offsetWidth; // restart the progress animation
    if (!still && n > 1) bar.classList.add("run");
  }
  function show(j) {
    cur = (j + n) % n;
    load(cur);
    load((cur + 1) % n);
    imgs.forEach(function (m, k) {
      m.classList.toggle("on", k === cur);
    });
    pips.forEach(function (b, k) {
      b.setAttribute("aria-current", String(k === cur));
    });
    f.querySelector(".frame-url").textContent = imgs[cur].dataset.path;
    f.querySelector(".frame-step").textContent =
      pad(cur + 1) + " / " + pad(n);
    f.querySelector(".frame-text").textContent = imgs[cur].alt;
    run();
  }
  pips.forEach(function (b, k) {
    b.onclick = function () {
      show(k);
    };
  });
  bar.addEventListener("animationend", function () {
    show(cur + 1);
  });
  ["mouseenter", "focusin"].forEach(function (e) {
    f.addEventListener(e, function () {
      f.classList.add("paused");
    });
  });
  ["mouseleave", "focusout"].forEach(function (e) {
    f.addEventListener(e, function () {
      f.classList.remove("paused");
    });
  });
  addEventListener("load", function () {
    imgs.forEach(function (m, k) {
      load(k);
    });
  });
  run();

  // "Try it yourself": prototype full screen in an iframe, Book button on top
  var t = $("try");
  var tf = $("try-frame");
  var last;
  function close() {
    t.hidden = true;
    tf.src = "about:blank";
    d.body.classList.remove("try-open");
    if (last) last.focus();
  }
  d.querySelectorAll("[data-try]").forEach(function (a) {
    a.onclick = function (e) {
      e.preventDefault();
      $("field-tried").value = DV.p;
      last = d.activeElement;
      $("try-loading").hidden = false;
      tf.src = DV.demo;
      t.hidden = false;
      d.body.classList.add("try-open");
      $("try-close").focus();
    };
  });
  tf.onload = function () {
    if (!t.hidden) $("try-loading").hidden = true;
  };
  $("try-close").onclick = close;
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !t.hidden) close();
  });
  // ?demo=1 (the /work gallery's "Try the workflow"): open the prototype straight away
  if (q.get("demo") === "1") d.querySelector("[data-try]").click();

  // Sticky "Book 30 min" bar: after the problem, hidden near the intake form
  var bb = $("book-bar");
  var anchor = $("p-" + DV.p);
  var intake = $("intake");
  function ub() {
    var h = innerHeight;
    bb.classList.toggle(
      "visible",
      anchor.getBoundingClientRect().bottom < h * 0.5 &&
        intake.getBoundingClientRect().top > h * 0.9,
    );
  }
  addEventListener("scroll", ub, { passive: true });
  addEventListener("resize", ub);

  // Stack variant: other problems sit above, so open on the lead's problem
  if (DV.v === "stack" && !location.hash) {
    d.documentElement.style.scrollBehavior = "auto";
    anchor.scrollIntoView();
    d.documentElement.style.scrollBehavior = "";
  }
  ub();
})({{config}});
