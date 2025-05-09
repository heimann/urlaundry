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
  const [darkMode, setDarkMode] = createSignal(true);
  let input!: HTMLInputElement;

  /* autofocus + clipboard bootstrap + theme detection */
  onMount(async () => {
    // Focus the input field
    input.focus();

    // Check for system preference (default to dark if can't detect)
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setDarkMode(false);
      document.body.classList.remove("dark");
    }

    // Check clipboard for URLs
    try {
      const clip = await navigator.clipboard.readText();
      if (isValidUrl(clip)) setUrl(clip);
    } catch {
      /* ignore permission errors */
    }
  });

  function toggleTheme(e?: Event) {
    // If the function is called from the onChange event, use the checkbox value
    let newMode;
    if (e && e.target && "checked" in e.target) {
      newMode = !(e.target as HTMLInputElement).checked;
    } else {
      newMode = !darkMode();
    }

    setDarkMode(newMode);

    if (newMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

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
    /*  Main container with dynamic styles based on theme */
    <main
      class={`min-h-screen flex justify-center px-6 pt-24 font-mono transition-colors duration-300 ${darkMode() ? "bg-neutral-900 text-neutral-200" : "bg-neutral-100 text-neutral-800"}`}
    >
      {/* Super simple theme toggle */}
      <div class="absolute top-4 right-4">
        <label class="inline-block cursor-pointer">
          <input
            type="checkbox"
            checked={!darkMode()}
            onChange={toggleTheme}
            class="sr-only" // Visually hidden but accessible
          />
          <span
            class="flex items-center w-12 h-6 rounded-full px-1"
            style={{
              background: darkMode() ? "#444" : "#ddd",
              border: "1px solid #555",
            }}
          >
            <span
              class="block w-4 h-4 rounded-full"
              style={{
                background: darkMode() ? "#fff" : "#222",
                border: "1px solid #555",
                transform: darkMode() ? "translateX(0)" : "translateX(24px)",
                transition: "transform 0.2s",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            ></span>
          </span>
        </label>
      </div>

      <div class="flex w-full max-w-2xl flex-col gap-6">
        <div class="text-center">
          <h1 class="text-2xl font-semibold mb-2">URLaundry</h1>
          <p class={darkMode() ? "text-neutral-400" : "text-neutral-600"}>
            Clean your URLs by removing tracking parameters and other clutter.
            <br />
            All processing happens locally in your browser.
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
              class={`flex-1 bg-transparent border-b px-2 py-2 text-sm focus:outline-none transition-colors ${darkMode()
                  ? "border-neutral-600 placeholder-neutral-500 focus:border-neutral-300"
                  : "border-neutral-400 placeholder-neutral-500 focus:border-neutral-700"
                }`}
            />
            <button
              type="submit"
              class={`shrink-0 w-24 border px-4 py-2 text-xs uppercase tracking-wide
              focus:outline-none focus:ring-2 transition-colors ${darkMode()
                  ? "border-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 focus:ring-neutral-400"
                  : "border-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 focus:ring-neutral-600"
                }`}
            >
              {copied() ? "📋" : "clean"}
            </button>
          </div>

          {/* show result */}
          {cleaned() && (
            <div
              class={`mt-4 rounded border p-4 text-sm space-y-1 transition-colors ${darkMode() ? "border-neutral-700" : "border-neutral-300"
                }`}
            >
              <div class="font-semibold text-green-500">✅ Cleaned</div>
              <div class={darkMode() ? "text-neutral-400" : "text-neutral-600"}>
                Removed {removed()} param{removed() !== 1 && "s"}
              </div>
              <div
                class={`break-all ${darkMode() ? "text-neutral-300" : "text-neutral-700"}`}
              >
                <a class="underline" href={cleaned()}>{cleaned()}</a>
              </div>
            </div>
          )}
        </form>

        {/* Footer with credit */}
        <div
          class={`mt-8 text-center text-sm ${darkMode() ? "text-neutral-500" : "text-neutral-500"}`}
        >
          <div class="flex items-center justify-center gap-2">
            <span>Made by</span>
            <a
              href="https://dmeh.net"
              target="_blank"
              rel="noopener noreferrer"
              class={`border-b hover:border-neutral-400 transition-colors ${darkMode()
                  ? "border-neutral-600 text-neutral-400 hover:text-neutral-300"
                  : "border-neutral-400 text-neutral-600 hover:text-neutral-700"
                }`}
            >
              David Heimann
            </a>
            <a
              href="https://github.com/heimann/urlaundry"
              target="_blank"
              rel="noopener noreferrer"
              class={`inline-flex items-center ${darkMode()
                  ? "text-neutral-400 hover:text-neutral-300"
                  : "text-neutral-600 hover:text-neutral-700"
                }`}
              aria-label="View source on GitHub"
            >
              <svg
                height="18"
                width="18"
                viewBox="0 0 16 16"
                style={{
                  fill: "currentColor",
                }}
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
