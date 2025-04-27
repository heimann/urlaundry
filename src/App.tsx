import "./App.css"; /* App.tsx – SolidJS */
/* App.tsx */
/* App.tsx */
import { createSignal, onMount } from "solid-js";

/* ------------------------------------------------------------------ */
/* 1 ‣ helpers                                                        */
/* ------------------------------------------------------------------ */

const isValidUrl = (s: string) => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
};

/* full clean-URL routine (unchanged from your script) */
function cleanUrl(raw: string): { url: string; preservedParams: string[] } {
  try {
    const urlObj = new URL(raw);
    const hostname = urlObj.hostname;
    const preservedParams: string[] = [];

    const importantParams: Record<string, string[]> = {
      // Video platforms
      "youtube.com": ["v", "t", "list", "index", "start"],
      "youtu.be": ["t", "si"],
      "vimeo.com": ["h", "clip_id"],
      "twitch.tv": ["video", "collection", "t"],
      "dailymotion.com": ["video"],
      // Search engines
      "google.com": ["q", "tbm", "tbs", "start", "hl"],
      "bing.com": ["q", "filters", "pq"],
      "duckduckgo.com": ["q", "ia", "t", "kp"],
      // Maps
      "maps.google.com": [
        "q",
        "z",
        "ll",
        "t",
        "data",
        "mapclient",
        "mra",
        "daddr",
        "saddr",
      ],
      "openstreetmap.org": ["mlat", "mlon", "zoom"],
      // E-commerce
      "amazon.com": ["dp", "gp/product", "pf_rd_r"],
      "ebay.com": ["item", "itm"],
      "etsy.com": ["listing"],
      // Media / streaming
      "spotify.com": ["track", "album", "playlist", "show", "episode"],
      "soundcloud.com": ["in", "t"],
      "netflix.com": ["trackId", "jbv", "jb"],
      // Social
      "twitter.com": ["status", "id", "q", "s"],
      "x.com": ["status", "id", "q", "s"],
      "reddit.com": ["sort", "after", "before", "t", "q"],
      "linkedin.com": ["trackingId"],
      "facebook.com": ["story_fbid", "id", "video_id", "set"],
      "instagram.com": ["igshid"],
      // Dev / productivity
      "github.com": ["q", "tab", "l", "t", "since", "until", "type"],
      "docs.google.com": ["gid", "usp"],
      "drive.google.com": ["id"],
      "stackoverflow.com": ["q", "sort", "page", "tab"],
      // News
      "medium.com": ["source", "id"],
      "nytimes.com": ["searchResultPosition"],
      // General / other
      "wikipedia.org": ["oldid", "uselang", "title", "section"],
      "zoom.us": ["pwd", "uname"],
      "meet.google.com": ["authuser"],
    };

    /* find matching domain (sub- and ccTLD-aware) */
    const domainKey = Object.keys(importantParams).find(
      (d) =>
        hostname === d ||
        hostname.endsWith("." + d) ||
        hostname.match(
          new RegExp(`\\.${d.replace(/\./g, "\\.")}\\.[a-z]{2,3}$`),
        ),
    );

    if (domainKey) {
      const paramsToKeep = importantParams[domainKey];
      const cleaned = new URL(urlObj.origin + urlObj.pathname);

      paramsToKeep.forEach((p) => {
        if (urlObj.searchParams.has(p)) {
          cleaned.searchParams.set(p, urlObj.searchParams.get(p)!);
          preservedParams.push(p);
        }
      });

      if (urlObj.hash) cleaned.hash = urlObj.hash;

      return { url: cleaned.toString(), preservedParams };
    }

    /* unknown domain → strip all params, keep hash */
    return {
      url: urlObj.origin + urlObj.pathname + (urlObj.hash || ""),
      preservedParams: [],
    };
  } catch {
    /* malformed input → return unchanged */
    return { url: raw, preservedParams: [] };
  }
}

/* ------------------------------------------------------------------ */
/* 2 ‣ Solid component                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [url, setUrl] = createSignal("");
  const [cleaned, setCleaned] = createSignal("");
  const [removed, setRemoved] = createSignal(0);
  const [copied, setCopied] = createSignal(false);
  let input!: HTMLInputElement;

  /* autofocus + clipboard bootstrap */
  onMount(async () => {
    input.focus();
    try {
      const clip = await navigator.clipboard.readText();
      if (isValidUrl(clip)) setUrl(clip);
    } catch {
      /* ignore permission errors */
    }
  });

  async function handleClean(e?: Event) {
    e?.preventDefault();
    const raw = url().trim();
    if (!raw) return;

    const result = cleanUrl(raw);
    if (!result) {
      // null-safety guard
      console.error("cleanUrl() returned nothing");
      return;
    }

    console.log("✅ cleaned:", result.url, "| kept:", result.preservedParams);
    setCleaned(result.url);
    const originalParamCount = new URL(raw).searchParams.size;
    setRemoved(originalParamCount - result.preservedParams.length);

    console.log(
      "✅ cleaned:",
      result.url,
      "| kept:",
      result.preservedParams,
      "| removed:",
      removed(),
    );
    setCleaned(result.url);
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true); // show 📋
      setTimeout(() => setCopied(false), 1200); // reset after 1.2 s
    } catch {
      console.warn("clipboard write failed");
    }
  }

  return (
    /*  no bg-color here → no pillar  */
    <main class="min-h-screen flex justify-center px-6 pt-24 font-mono text-neutral-200">
      <div class="flex w-full max-w-2xl flex-col gap-6">
        <div class="text-center">
          <h1 class="text-2xl font-semibold mb-2">URLaundry</h1>
          <p class="text-neutral-400">
            Clean your URLs by removing tracking parameters and other clutter.
            <br />All processing happens locally in your browser.
          </p>
        </div>
        <form class="flex w-full flex-col gap-4" onSubmit={handleClean}>
        {/* input + button */}
        <div class="flex gap-3">
          <input
            ref={(el) => (input = el)}
            type="url"
            placeholder="paste url here →"
            value={url()}
            onInput={(e) => setUrl(e.currentTarget.value)}
            class="flex-1 bg-transparent border-b border-neutral-600 px-2 py-2 text-sm placeholder-neutral-500 focus:border-neutral-300 focus:outline-none"
          />
          <button
            type="submit"
            class="shrink-0 w-24 border border-neutral-600 px-4 py-2 text-xs uppercase tracking-wide
            hover:bg-neutral-200 hover:text-neutral-900
            focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
          >
            {copied() ? "📋" : "clean"}
          </button>
        </div>

        {/* show result */}
        {cleaned() && (
          <div class="mt-4 rounded border border-neutral-700 p-4 text-sm space-y-1">
            <div class="font-semibold text-green-400">✅ Cleaned</div>
            <div class="text-neutral-400">
              Removed {removed()} param{removed() !== 1 && "s"}
            </div>
            <div class="break-all text-neutral-300">{cleaned()}</div>
          </div>
        )}
      </form>
      </div>
    </main>
  );
}
