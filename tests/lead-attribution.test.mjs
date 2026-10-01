import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../src/lead-attribution.js", import.meta.url), "utf8");
const calendar = "https://cal.com/deltav.support/30min";

function visit({ pathname = "/", search = "", referrer = "", saved, problemBook } = {}) {
  const store = new Map(saved ? [["deltav_first_touch_v1", JSON.stringify(saved)]] : []);
  const fields = new Map();
  const links = [{ href: calendar }, { href: calendar }];
  const window = {
    location: { hostname: "deltav.build", pathname, search },
    sessionStorage: { getItem: (key) => store.get(key), setItem: (key, value) => store.set(key, value) },
    ...(problemBook ? { DV_BOOK: problemBook } : {}),
  };
  const document = {
    referrer,
    querySelector(selector) {
      const name = selector.match(/^\[name="([^"]+)"\]$/)?.[1];
      if (!name) return null;
      if (!fields.has(name)) fields.set(name, { value: "" });
      return fields.get(name);
    },
    querySelectorAll: () => links,
  };
  vm.runInNewContext(source, { window, document, URL, URLSearchParams });
  return { window, links, fields, url: new URL(links[0].href) };
}

test("organic CNC visits carry search attribution into every booking link and the form", () => {
  const result = visit({ pathname: "/cnc/", referrer: "https://www.google.com/search?q=cnc+quoting", problemBook: `${calendar}?utm_source=coldemail&utm_campaign=cnc` });
  assert.equal(result.url.searchParams.get("utm_source"), "www.google.com");
  assert.equal(result.url.searchParams.get("utm_medium"), "organic");
  assert.equal(result.url.searchParams.get("utm_content"), "/cnc/");
  assert.equal(result.fields.get("source_channel").value, "organic");
  assert.equal(result.fields.get("entry_page").value, "/cnc/");
  assert.ok(result.links.every((a) => a.href === result.window.DV_BOOK));
});

test("direct industry visits are not invented cold-email visits", () => {
  const { url } = visit({ pathname: "/crane/", problemBook: `${calendar}?utm_source=website&utm_medium=direct` });
  assert.equal(url.searchParams.get("utm_source"), "website");
  assert.equal(url.searchParams.get("utm_medium"), "direct");
  assert.equal(url.searchParams.get("utm_content"), "/crane/");
});

test("explicit outreach campaign tags remain intact", () => {
  const query = "utm_source=outreach&utm_medium=email&utm_campaign=crane&utm_content=followup&utm_term=Acme";
  const book = `${calendar}?${query}`;
  const result = visit({ pathname: "/crane/", search: `?${query}`, problemBook: book });
  assert.equal(result.window.DV_BOOK, book);
  assert.equal(result.fields.get("source_channel").value, "email");
  assert.equal(result.fields.get("utm_campaign").value, "crane");
  assert.ok(result.links.every((a) => a.href === book));
});

test("an internal move to a prototype preserves the original search landing page", () => {
  const saved = { entry_page: "/insights/procore-quickbooks-integration/", source_channel: "organic", referrer_host: "www.bing.com" };
  const { url, fields } = visit({ pathname: "/ap/", referrer: "https://deltav.build/insights/procore-quickbooks-integration/", saved, problemBook: `${calendar}?utm_source=website` });
  assert.equal(url.searchParams.get("utm_source"), "www.bing.com");
  assert.equal(url.searchParams.get("utm_medium"), "organic");
  assert.equal(url.searchParams.get("utm_content"), saved.entry_page);
  assert.equal(fields.get("entry_page").value, saved.entry_page);
});

test("company personalization survives the corrected source attribution", () => {
  const { url } = visit({ pathname: "/cnc/", search: "?c=Acme", referrer: "https://www.google.com/search?q=cnc", problemBook: `${calendar}?utm_source=website&utm_term=Acme` });
  assert.equal(url.searchParams.get("utm_term"), "Acme");
  assert.equal(url.searchParams.get("utm_medium"), "organic");
  assert.equal(url.origin + url.pathname, calendar);
});

test("service-page booking links also include the first landing page", () => {
  const { url } = visit({ pathname: "/services/workflow-automation/", referrer: "https://www.google.com/search?q=workflow+automation" });
  assert.equal(url.searchParams.get("utm_medium"), "organic");
  assert.equal(url.searchParams.get("utm_content"), "/services/workflow-automation/");
});
