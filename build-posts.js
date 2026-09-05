import fs from "node:fs";
import path from "node:path";

const PAGES = [
  { file: "music.html", category: "Musik" },
  { file: "projects.html", category: "Projekte" },
  { file: "adventures.html", category: "Abenteuer" },
];

function parseDate(dateStr) {
  if (!dateStr) return 0;
  // Parse format DD.MM.YYYY (e.g. 04.09.2026)
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    return new Date(year, month, day).getTime();
  }
  return 0;
}

export function buildPosts() {
  const startTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] Scanning articles from category pages...`);

  const articles = [];

  for (const { file, category } of PAGES) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, "utf-8");

    // Match all <article> tags
    const articleRegex = /<article([^>]*)>([\s\S]*?)<\/article>/gi;
    let match;
    let orderIndex = 0;

    while ((match = articleRegex.exec(html)) !== null) {
      const attrs = match[1];
      const content = match[2];

      const idMatch = attrs.match(/id=["\x27]([^"\x27]+)["\x27]/i);
      const id = idMatch ? idMatch[1] : "";

      const dateMatch = content.match(/<(?:span|time)[^>]*>([^<]+)<\/(?:span|time)>/i);
      const date = dateMatch ? dateMatch[1].trim() : "";

      const titleMatch = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

      const imgMatch = content.match(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/i);
      const image = imgMatch ? imgMatch[1].trim() : "img/guitar.webp";

      const pMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const preview = pMatch ? pMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

      articles.push({
        category,
        title,
        date,
        timestamp: parseDate(date),
        orderIndex: orderIndex++,
        image,
        preview,
        url: id ? `${file}#${id}` : file,
      });
    }
  }

  // Sort: newest date first; if equal date, preserve top appearance
  articles.sort((a, b) => {
    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
    return a.orderIndex - b.orderIndex;
  });

  // Remove internal timestamp/orderIndex from final JSON
  const cleanedArticles = articles.map(({ timestamp, orderIndex, ...rest }) => rest);

  // Write posts.json
  fs.writeFileSync(path.resolve("posts.json"), JSON.stringify(cleanedArticles, null, 2), "utf-8");

  // Update latest post directly in index.html for static rendering
  const indexPath = path.resolve("index.html");
  if (fs.existsSync(indexPath) && cleanedArticles.length > 0) {
    const latest = cleanedArticles[0];
    let indexHtml = fs.readFileSync(indexPath, "utf-8");

    // Update category
    indexHtml = indexHtml.replace(
      /<span id="latest-category"[^>]*>[\s\S]*?<\/span>/i,
      `<span id="latest-category" class="text-xs uppercase tracking-widest font-semibold text-emerald-700">${latest.category}</span>`
    );

    // Update title
    indexHtml = indexHtml.replace(
      /<h3 id="latest-title"[^>]*>[\s\S]*?<\/h3>/i,
      `<h3 id="latest-title" class="font-medium text-xl leading-snug text-slate-700">${latest.title}</h3>`
    );

    // Update desc/preview
    indexHtml = indexHtml.replace(
      /<p id="latest-desc"[^>]*>[\s\S]*?<\/p>/i,
      `<p id="latest-desc" class="line-clamp-3 text-sm text-slate-600">${latest.preview}</p>`
    );

    // Update link
    indexHtml = indexHtml.replace(
      /<a id="latest-link"[^>]*href=["\x27][^"\x27]*["\x27]/i,
      `<a id="latest-link" href="${latest.url}"`
    );

    // Update image
    const webpImage = latest.image.endsWith(".webp")
      ? latest.image
      : latest.image.replace(/\.(png|jpe?g)$/i, ".webp");

    indexHtml = indexHtml.replace(
      /<source id="latest-source"[^>]*srcset=["\x27][^"\x27]*["\x27]/i,
      `<source id="latest-source" srcset="${webpImage}"`
    );

    indexHtml = indexHtml.replace(
      /(<img[^>]*?id=["\x27]latest-img["\x27][^>]*?src=["\x27])([^"\x27]*)(["\x27])/i,
      `$1${latest.image}$3`
    );

    fs.writeFileSync(indexPath, indexHtml, "utf-8");
  }

  const elapsed = Date.now() - startTime;
  console.log(`[${new Date().toLocaleTimeString()}] Found ${articles.length} article(s). Latest: "${articles[0]?.title || 'none'}" (${elapsed}ms)`);
}

// Run directly if invoked from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("build-posts.js")) {
  try {
    buildPosts();
  } catch (err) {
    console.error("build-posts failed:", err);
    process.exit(1);
  }
}
