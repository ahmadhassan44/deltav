(function () {
  var storageKey = "deltav_first_touch_v1";
  var utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var clean = function (value) {
    return String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 160);
  };
  var page = clean(window.location.pathname || "/").slice(0, 240) || "/";
  var params = new URLSearchParams(window.location.search);
  var utm = {};
  utmKeys.forEach(function (key) {
    utm[key] = clean(params.get(key));
  });

  var referrerHost = "";
  try {
    var referrer = document.referrer ? new URL(document.referrer) : null;
    var currentHost = window.location.hostname.toLowerCase().replace(/^www\./, "");
    if (referrer && referrer.hostname.toLowerCase().replace(/^www\./, "") !== currentHost) {
      referrerHost = clean(referrer.hostname.toLowerCase());
    }
  } catch (_) {}

  var medium = utm.utm_medium.toLowerCase();
  var channel = "direct";
  if (/^(cpc|ppc|paid|paid-search|paid-social|display|programmatic)$/.test(medium)) {
    channel = "paid";
  } else if (/^(email|newsletter)$/.test(medium)) {
    channel = "email";
  } else if (/^(organic|seo)$/.test(medium)) {
    channel = "organic";
  } else if (/^(social|organic-social)$/.test(medium)) {
    channel = "social";
  } else if (/^(owned|website|portfolio)$/.test(medium)) {
    channel = "owned";
  } else if (utm.utm_source) {
    channel = "campaign";
  } else if (referrerHost) {
    if (/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|baidu\.com)$/.test(referrerHost)) {
      channel = "organic";
    } else if (/(^|\.)(linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com|youtube\.com|tiktok\.com)$/.test(referrerHost)) {
      channel = "social";
    } else {
      channel = "referral";
    }
  }

  var firstTouch = {
    entry_page: page,
    source_channel: channel,
    referrer_host: referrerHost,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    utm_term: utm.utm_term,
  };
  try {
    var saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
    if (saved && saved.entry_page && saved.source_channel) {
      firstTouch = saved;
    } else {
      window.sessionStorage.setItem(storageKey, JSON.stringify(firstTouch));
    }
  } catch (_) {}

  var setField = function (name, value) {
    var field = document.querySelector('[name="' + name + '"]');
    if (field) field.value = clean(value);
  };
  setField("source_page", page);
  setField("entry_page", firstTouch.entry_page);
  setField("source_channel", firstTouch.source_channel);
  setField("referrer_host", firstTouch.referrer_host);
  utmKeys.forEach(function (key) {
    setField(key, firstTouch[key]);
  });

  window.DV_BOOK_FROM_SITE = function (base) {
    var url = new URL(base);
    url.searchParams.set("utm_source", firstTouch.utm_source || firstTouch.referrer_host || "website");
    url.searchParams.set("utm_medium", firstTouch.utm_medium || firstTouch.source_channel || "direct");
    url.searchParams.set("utm_campaign", firstTouch.utm_campaign || "operations-software");
    url.searchParams.set("utm_content", firstTouch.utm_content || "book-call");
    if (firstTouch.utm_term) url.searchParams.set("utm_term", firstTouch.utm_term);
    return url.toString();
  };
})();
