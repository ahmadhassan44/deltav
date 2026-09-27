// Pings IndexNow (Bing, Yandex, Seznam, Naver…) with every URL in the live
// sitemap. Run after the Cloudflare build finishes: `npm run indexnow`.
// Bing feeds ChatGPT search and Copilot, so this is how new pages reach them.
// The key is public by design; src/<key>.txt proves we own the host.

const HOST = "deltav.build";
const KEY = "7c63166f0a4319a77431cb5b15e3ad46";

const sitemap = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (!urlList.length) throw new Error("No URLs in the live sitemap");

const keyCheck = await fetch(`https://${HOST}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  throw new Error(`Key file not live at https://${HOST}/${KEY}.txt — deploy first`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${response.status} ${response.statusText} — ${urlList.length} URLs`);
if (response.status >= 400) process.exit(1);
