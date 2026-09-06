import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve("content");
const POSTS_DIR = path.resolve("posts");
const LAYOUT_PATH = path.resolve("post-layout.html");

const CATEGORY_CONFIG = {
  projekte: { file: "projects.html", name: "Projekte", fallbackImage: "img/programmer.webp" },
  musik: { file: "music.html", name: "Musik", fallbackImage: "img/guitar.webp" },
  abenteuer: { file: "adventures.html", name: "Abenteuer", fallbackImage: "img/backpack.webp" },
};

const CATEGORY_PAGES = [
  { file: "projects.html", category: "Projekte" },
  { file: "music.html", category: "Musik" },
  { file: "adventures.html", category: "Abenteuer" },
];

function parseDate(dateStr) {
  if (!dateStr) return 0;
  // Parse format DD.MM.YYYY (e.g. 01.06.2026)
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
  console.log(`[${new Date().toLocaleTimeString()}] Scanning content directory...`);

  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  if (!fs.existsSync(LAYOUT_PATH)) {
    throw new Error(`Master layout template not found at: ${LAYOUT_PATH}`);
  }

  const layoutTemplate = fs.readFileSync(LAYOUT_PATH, "utf-8");

  const files = fs.readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith(".html") && f !== "template.html" && f !== "_template.html"
  );

  // Remove any obsolete post files in posts/ that no longer exist in content/
  const validFiles = new Set(files);
  for (const existingFile of fs.readdirSync(POSTS_DIR)) {
    if (existingFile.endsWith(".html") && !validFiles.has(existingFile)) {
      fs.unlinkSync(path.join(POSTS_DIR, existingFile));
      console.log(`[${new Date().toLocaleTimeString()}] Removed obsolete post: posts/${existingFile}`);
    }
  }

  const articles = [];

  for (const filename of files) {
    const filePath = path.join(CONTENT_DIR, filename);
    const rawContent = fs.readFileSync(filePath, "utf-8").trim();

    // Match <article>...</article> or wrap if missing
    let articleHtml = rawContent;
    let attrs = "";
    let content = rawContent;

    const articleMatch = rawContent.match(/<article([^>]*)>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      attrs = articleMatch[1];
      content = articleMatch[2];
      articleHtml = articleMatch[0];
    } else {
      articleHtml = `<article data-category="Projekte" class="my-4">\n${rawContent}\n</article>`;
    }

    // Category from data-category or fallback
    const catMatch = attrs.match(/data-category=["\x27]([^"\x27]+)["\x27]/i);
    let category = catMatch ? catMatch[1].trim() : "Projekte";
    const catKey = category.toLowerCase();
    const catConfig = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.projekte;

    // Date
    const dateMatch = content.match(/<(?:span|time)[^>]*>(\d{1,2}\.\d{1,2}\.\d{4})<\/(?:span|time)>/i);
    const date = dateMatch ? dateMatch[1].trim() : "";

    // Title (h1 or h2)
    const titleMatch = content.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : filename.replace(".html", "");

    // Image: explicit data-image on <article>, or first <img> in article
    const dataImgMatch = attrs.match(/data-image=["\x27]([^"\x27]+)["\x27]/i);
    let image = "";
    if (dataImgMatch) {
      image = dataImgMatch[1].trim();
    } else {
      const imgMatch = content.match(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/i);
      image = imgMatch ? imgMatch[1].trim() : "";
    }
    // If relative from posts/ (e.g. "../img/..."), strip leading "../"
    if (image.startsWith("../")) {
      image = image.slice(3);
    }

    if (!image || image.includes("dein-bild") || !fs.existsSync(path.resolve(image))) {
      image = catConfig.fallbackImage;
    }

    // Preview paragraph
    const pMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const preview = pMatch ? pMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

    articles.push({
      category: catConfig.name,
      title,
      date,
      timestamp: parseDate(date),
      image,
      preview,
      url: `posts/${filename}`,
    });

    // Generate standalone post file in posts/
    const renderedPost = layoutTemplate
      .replace(/{{TITLE}}/g, `${title} - Alissa's Blog`)
      .replace(/{{CATEGORY_PAGE}}/g, catConfig.file)
      .replace(/{{CATEGORY_NAME}}/g, catConfig.name)
      .replace(/{{CONTENT}}/g, articleHtml);

    fs.writeFileSync(path.join(POSTS_DIR, filename), renderedPost, "utf-8");
  }

  // Sort descending: newest first
  articles.sort((a, b) => b.timestamp - a.timestamp);

  // Write posts.json
  const cleanedArticles = articles.map(({ timestamp, ...rest }) => rest);
  fs.writeFileSync(path.resolve("posts.json"), JSON.stringify(cleanedArticles, null, 2), "utf-8");

  // 1. Update latest post card in index.html
  const indexPath = path.resolve("index.html");
  if (fs.existsSync(indexPath) && cleanedArticles.length > 0) {
    const latest = cleanedArticles[0];
    let indexHtml = fs.readFileSync(indexPath, "utf-8");

    // Update category
    indexHtml = indexHtml.replace(
      /<span id="latest-category"[^>]*>[\s\S]*?<\/span>/i,
      `<span id="latest-category" class="text-xs uppercase tracking-widest font-semibold text-emerald-700 dark:text-emerald-400">${latest.category}</span>`
    );

    // Update title
    indexHtml = indexHtml.replace(
      /<h3 id="latest-title"[^>]*>[\s\S]*?<\/h3>/i,
      `<h3 id="latest-title" class="font-bold text-2xl sm:text-3xl leading-snug text-slate-800 dark:text-slate-100">${latest.title}</h3>`
    );

    // Update desc/preview
    indexHtml = indexHtml.replace(
      /<p id="latest-desc"[^>]*>[\s\S]*?<\/p>/i,
      `<p id="latest-desc" class="line-clamp-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">${latest.preview}</p>`
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

  // 2. Update category overview pages
  for (const { file, category } of CATEGORY_PAGES) {
    const pagePath = path.resolve(file);
    if (!fs.existsSync(pagePath)) continue;

    const categoryArticles = cleanedArticles.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
    let pageHtml = fs.readFileSync(pagePath, "utf-8");

    const cardsHtml =
      categoryArticles.length > 0
        ? categoryArticles
            .map(
              (art) => `
        <article class="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between border border-slate-100 dark:border-slate-700/60">
          <div>
            <a href="${art.url}" class="block overflow-hidden">
              <img src="${art.image}" alt="${art.title}" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300 mx-auto" />
            </a>
            <div class="p-5 flex flex-col gap-2">
              <span class="text-xs text-slate-400 dark:text-slate-400 uppercase tracking-wider">${art.date}</span>
              <h2 class="font-bold text-xl leading-snug text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                <a href="${art.url}">${art.title}</a>
              </h2>
              <p class="line-clamp-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ${art.preview}
              </p>
            </div>
          </div>
          <div class="p-5 pt-0">
            <a href="${art.url}" class="text-xs font-bold uppercase tracking-wider text-header dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              Beitrag lesen →
            </a>
          </div>
        </article>`
            )
            .join("\n")
        : `        <p class="text-slate-500 dark:text-slate-400 italic col-span-full py-8 text-center">Noch keine Beiträge in dieser Kategorie vorhanden.</p>`;

    // Replace posts-list using robust markers to avoid nested div matching issues
    const markerStart = "<!-- POSTS_LIST_START -->";
    const markerEnd = "<!-- POSTS_LIST_END -->";
    const newPostsBlock = `${markerStart}\n      <div id="posts-list" class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">\n${cardsHtml}\n      </div>\n      ${markerEnd}`;

    if (pageHtml.includes(markerStart) && pageHtml.includes(markerEnd)) {
      const startIdx = pageHtml.indexOf(markerStart);
      const endIdx = pageHtml.indexOf(markerEnd) + markerEnd.length;
      pageHtml = pageHtml.slice(0, startIdx) + newPostsBlock + pageHtml.slice(endIdx);
      fs.writeFileSync(pagePath, pageHtml, "utf-8");
    } else if (pageHtml.includes('id="posts-list"') || pageHtml.includes("<!-- BLOG-BEITRÄGE")) {
      pageHtml = pageHtml.replace(
        /(?:<!-- =+ -->[\s\S]*?<!-- BLOG-BEITRÄGE[\s\S]*?-->[\s\S]*?<!-- =+ -->|<div id="posts-list")[\s\S]*?(?=\s*<\/main>)/i,
        `<!-- ============================================================== -->\n      <!-- BLOG-BEITRÄGE (Wird automatisch von build-posts.js befüllt)     -->\n      <!-- ============================================================== -->\n      ${newPostsBlock}`
      );
      fs.writeFileSync(pagePath, pageHtml, "utf-8");
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[${new Date().toLocaleTimeString()}] Processed ${articles.length} post(s) from content/. Latest: "${articles[0]?.title || 'none'}" (${elapsed}ms)`);
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
