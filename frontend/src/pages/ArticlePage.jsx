import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { DISPATCHES } from "@/data/siteContent";

const textFixes = [
  ["â€“", "-"],
  ["â€”", "-"],
  ["â€˜", "'"],
  ["â€™", "'"],
  ["â€œ", '"'],
  ["â€", '"'],
  ["â€¢", "-"],
  ["Ã¢â‚¬â€œ", "-"],
  ["Ã¢â‚¬â€", "-"],
  ["Ã¢â‚¬Ëœ", "'"],
  ["Ã¢â‚¬â„¢", "'"],
  ["Ã¢â‚¬Å“", '"'],
  ["Ã¢â‚¬Â", '"'],
  ["Ã¢â‚¬", '"'],
  ["Ã‚", ""],
  ["ÃƒÂ®", "i"],
  ["Ã¢â‚¬Â¢", "-"],
];

/*
 * Existing manually mapped article figures.
 * These are preserved exactly as before.
 */
const articleFigures = {
  "china-western-theatre-command-evolving-posture": [
    {
      caption: "Basic Chinese Defence Structure",
      image: "/article-doc-assets/image1.png",
    },
    {
      caption: "Geographic coverage of Chinese Theatre Commands",
      image: "/article-doc-assets/image9.png",
    },
    {
      caption:
        "A hillside storage facility and an underground fuel storage site in WTC",
      image: "/article-doc-assets/image2.png",
    },
    {
      caption:
        "Trenches near a BDR Company Base in Yadong County, Shigatse, Tibet",
      image: "/article-doc-assets/image12.png",
    },
    {
      caption:
        "HQs of 55th Light CAB under 77th and 17th Heavy CAB under 76th GA in WTC",
      image: "/article-doc-assets/image6.png",
    },
    {
      caption:
        "364th Border Defence Regiment HQ in Akta County, Xinjiang",
      image: "/article-doc-assets/image10.png",
    },
    {
      caption:
        "Upgrades at Ngari Gunsa Airport, 120 km from Indian border",
      image: "/article-doc-assets/image4.png",
    },
    {
      caption: "Some permanent PLAAF SAM positions in WTC",
      image: "/article-doc-assets/image3.png",
    },
    {
      caption: "Some PLA radar installations in WTC",
      image: "/article-doc-assets/image5.png",
    },
    {
      caption:
        "Some of the Chinese ballistic missiles with PLARF. Source: js7tv.cn",
      image: "/article-doc-assets/image8.jpg",
    },
    {
      caption: "A PLARF Missile Brigade base in Urumqi, Xinjiang",
      image: "/article-doc-assets/image7.png",
    },
    {
      caption:
        "A Large Phased Array Radar in Korla, used for monitoring missile test launches from the Korla Missile Test Complex Launch Site",
      image: "/article-doc-assets/image11.png",
    },
  ],
};

/*
 * Automatic document images.
 *
 * These images are inserted between suitable article paragraphs.
 *
 * Geospatial Intelligence:
 * image-2.png
 * image-3.png
 * image-4.png
 * image-5.png
 *
 * Control of Air:
 * image-1.png
 * image-2.png
 * image-3.png
 */
const articleImageFolders = {
  "geospatial-intelligence-india-future-defence-edge":
    "/article-doc-assets/geospatial-intelligence-and-indias-future-defence-edge",

  "control-of-air-future-regional-dynamics":
    "/article-doc-assets/control-of-air-future-regional-dynamics",
};

const articleImages = {
  "geospatial-intelligence-india-future-defence-edge": [
    "image-2.png",
    "image-3.png",
    "image-4.png",
    "image-5.png",
  ],

  "control-of-air-future-regional-dynamics": [
    "image-1.png",
    "image-2.png",
    "image-3.png",
  ],
};

function cleanArticleText(value) {
  return textFixes.reduce(
    (text, [broken, fixed]) => text.replaceAll(broken, fixed),
    value
  );
}

function normalizeFigureCaption(value) {
  return cleanArticleText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitCaptionPrefix(block, figure) {
  const caption = cleanArticleText(figure.caption);

  if (!block.startsWith(caption)) {
    return "";
  }

  return block.slice(caption.length).trim();
}

function isFigureMarker(block) {
  return block.startsWith("[[FIGURE|") && block.endsWith("]]");
}

function parseFigureMarker(block) {
  const marker = block.slice("[[FIGURE|".length, -2);
  const [image, ...captionParts] = marker.split("|");

  return {
    image,
    caption: captionParts.join("|").trim(),
  };
}

function isArticleHeading(block) {
  if (isFigureMarker(block)) {
    return false;
  }

  return block.length < 82 && !block.endsWith(".");
}

function headingId(block, index) {
  return `${block
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${index}`;
}

function splitLongParagraph(paragraph) {
  if (paragraph.length < 760) {
    return [paragraph];
  }

  const sentences =
    paragraph.match(/[^.!?]+[.!?]+["')\]]*|.+$/g) ?? [paragraph];

  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current
      ? `${current} ${sentence.trim()}`
      : sentence.trim();

    if (next.length > 620 && current) {
      chunks.push(current);
      current = sentence.trim();
      return;
    }

    current = next;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitArticleText(value) {
  const lines = cleanArticleText(value).split(/\r?\n/);
  const bodyLines = lines.slice(3);

  const blocks = [];
  let paragraphLines = [];
  let previousWasBlank = true;

  const pushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    splitLongParagraph(paragraphLines.join(" ").trim()).forEach(
      (paragraph) => {
        blocks.push(paragraph);
      }
    );

    paragraphLines = [];
  };

  bodyLines.forEach((line) => {
    const trimmed = line.trim();

    /*
     * Empty line = paragraph break.
     */
    if (!trimmed) {
      pushParagraph();
      previousWasBlank = true;
      return;
    }

    /*
     * Preserve explicit figure markers.
     */
    if (isFigureMarker(trimmed)) {
      pushParagraph();
      blocks.push(trimmed);
      previousWasBlank = true;
      return;
    }

    /*
     * Detect article headings.
     */
    const looksLikeHeading =
      previousWasBlank &&
      trimmed.length < 96 &&
      !/[.!?;:]$/.test(trimmed);

    if (looksLikeHeading) {
      pushParagraph();
      blocks.push(trimmed);
      previousWasBlank = false;
      return;
    }

    paragraphLines.push(trimmed);
    previousWasBlank = false;
  });

  pushParagraph();

  return blocks.filter(Boolean);
}

/*
 * Get automatic images for the current article.
 */
function getAutomaticImages(slug) {
  const folder = articleImageFolders[slug];
  const images = articleImages[slug] ?? [];

  if (!folder || !images.length) {
    return [];
  }

  return images.map((filename, index) => ({
    image: `${folder}/${filename}`,
    filename,
    index,
  }));
}

/*
 * Generate a readable caption from the image filename.
 *
 * image-2.png
 * -> Image 2
 */
function imageFallbackCaption(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ArticlePage() {
  const { slug } = useParams();

  const article = useMemo(
    () =>
      DISPATCHES.find(
        (item) => item.type === "free" && item.slug === slug
      ),
    [slug]
  );

  const [content, setContent] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);

  /*
   * Existing manually mapped figures.
   */
  const figures = useMemo(
    () => articleFigures[slug] ?? [],
    [slug]
  );

  /*
   * New automatic document images for:
   *
   * - Geospatial Intelligence
   * - Control of Air
   */
  const automaticImages = useMemo(
    () => getAutomaticImages(slug),
    [slug]
  );

  const freeArticles = useMemo(
    () => DISPATCHES.filter((item) => item.type === "free"),
    []
  );

  const relatedArticles = useMemo(() => {
    if (!article) {
      return [];
    }

    const currentIndex = freeArticles.findIndex(
      (item) => item.slug === article.slug
    );

    const nextArticle =
      freeArticles[(currentIndex + 1) % freeArticles.length];

    const sameCategory = freeArticles.filter(
      (item) =>
        item.slug !== article.slug &&
        item.tag === article.tag
    );

    const fallback = freeArticles.filter(
      (item) =>
        item.slug !== article.slug &&
        item.slug !== nextArticle?.slug
    );

    const seen = new Set([article.slug]);

    return [nextArticle, ...sameCategory, ...fallback]
      .filter(Boolean)
      .filter((item) => {
        if (seen.has(item.slug)) {
          return false;
        }

        seen.add(item.slug);
        return true;
      })
      .slice(0, 3);
  }, [article, freeArticles]);

  const tableOfContents = useMemo(
    () =>
      content
        .map((block, index) =>
          isArticleHeading(block)
            ? {
                id: headingId(block, index),
                title: block,
              }
            : null
        )
        .filter(Boolean),
    [content]
  );

  /*
   * Scroll to top whenever article changes.
   */
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [slug]);

  /*
   * Reading progress.
   */
  useEffect(() => {
    const updateProgress = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;

      setReadingProgress(
        scrollable > 0
          ? Math.min(
              100,
              (scrollTop / scrollable) * 100
            )
          : 0
      );
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      updateProgress,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      updateProgress
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateProgress
      );

      window.removeEventListener(
        "resize",
        updateProgress
      );
    };
  }, [slug]);

  /*
   * Load article TXT file.
   */
  useEffect(() => {
    if (!article?.contentPath) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadArticle() {
      setStatus("loading");
      setMessage("");

      try {
        const response = await fetch(
          article.contentPath,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load article"
          );
        }

        const text = await response.text();

        const blocks =
          splitArticleText(text);

        setContent(blocks);
        setStatus("ready");
      } catch (error) {
        if (
          error.name !== "AbortError"
        ) {
          setMessage(error.message);
          setStatus("error");
        }
      }
    }

    loadArticle();

    return () =>
      controller.abort();
  }, [article]);

  async function shareArticle() {
    const shareUrl =
      window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.teaser,
        url: shareUrl,
      });

      return;
    }

    await navigator.clipboard?.writeText(
      shareUrl
    );
  }

  if (!article) {
    return (
      <section className="article-reader-page min-h-screen px-4 pb-16 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="article-reader-panel p-6 md:p-8">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.18em] text-ember">
              Article
            </p>

            <h1 className="mt-3 font-rajdhani text-4xl font-bold leading-none text-chalk">
              Article not found.
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="article-reader-page min-h-screen px-4 pb-16 pt-24 md:px-8">
      <div
        className="article-progress-bar"
        aria-hidden="true"
      >
        <span
          style={{
            width: `${readingProgress}%`,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <article className="article-reader-panel overflow-hidden">
          {/* HERO */}
          <div
            className="article-reader-layout has-contents"
          >
            <div className="article-main">
              {/* MASTHEAD - text first, so the title is never overlaid on
                  the photo or clipped by the sticky nav. */}
              <header className="article-masthead">
                <Link to="/#read" className="article-side-link">
                  <ArrowLeft className="size-4" />
                  Articles
                </Link>

                <div className="article-reader-meta">
                  <span>{article.tag}</span>
                  <span>{article.readTime}</span>
                </div>

                <h1 className="article-masthead__title">
                  {article.title}
                </h1>

                <p className="article-reader-deck">
                  {article.teaser}
                </p>

                <div className="article-masthead__foot">
                  <p className="article-reader-byline">
                    by {article.author}
                  </p>

                  <button
                    type="button"
                    className="article-share-button"
                    onClick={() => {
                      shareArticle().catch(() => {});
                    }}
                  >
                    <Share2 className="size-4" />
                    Share
                  </button>
                </div>
              </header>

              {/* BANNER */}
              <figure className="article-banner">
                <img
                  src={article.image}
                  alt=""
                  loading="eager"
                />
              </figure>

              {/* ARTICLE LAYOUT */}


              {/* ARTICLE BODY */}
              <div className="article-reader-body">
                {status === "loading" ? (
                  <p className="font-plex text-sm text-ash">
                    Loading article...
                  </p>
                ) : null}

                {status === "error" ? (
                  <p className="font-plex text-sm text-ember">
                    {message}
                  </p>
                ) : null}

                {status === "ready" &&
                content.length
                  ? (() => {
                      let paragraphIndex = 0;

                      let automaticImageIndex = 0;

                      /*
                       * Count only actual paragraphs.
                       *
                       * Headings and explicit figures
                       * are excluded from the calculation.
                       */
                      const totalParagraphs =
                        content.filter(
                          (item) =>
                            !isFigureMarker(
                              item
                            ) &&
                            !isArticleHeading(
                              item
                            )
                        ).length;

                      /*
                       * Distribute automatic images
                       * throughout the article.
                       *
                       * Example:
                       * 20 paragraphs + 4 images
                       * = approximately every 4 paragraphs.
                       */
                      const imageInterval =
                        automaticImages.length
                          ? Math.max(
                              1,
                              Math.round(
                                totalParagraphs /
                                  (automaticImages.length +
                                    1)
                              )
                            )
                          : 0;

                      return content.map(
                        (
                          block,
                          index
                        ) => {
                          /*
                           * EXPLICIT FIGURE
                           *
                           * Example TXT:
                           *
                           * [[FIGURE|image.png|Caption]]
                           */
                          if (
                            isFigureMarker(
                              block
                            )
                          ) {
                            const figure =
                              parseFigureMarker(
                                block
                              );

                            return (
                              <figure
                                key={`${figure.image}-${index}`}
                                className="article-reader-figure"
                              >
                                <img
                                  src={
                                    figure.image
                                  }
                                  alt={
                                    figure.caption ||
                                    "Article figure"
                                  }
                                  loading="lazy"
                                />

                                {figure.caption ? (
                                  <figcaption>
                                    {
                                      figure.caption
                                    }
                                  </figcaption>
                                ) : null}
                              </figure>
                            );
                          }

                          /*
                           * EXISTING MANUAL FIGURE
                           *
                           * Used by the China article.
                           */
                          const normalizedBlock =
                            normalizeFigureCaption(
                              block
                            );

                          const figure =
                            figures.find(
                              (item) =>
                                normalizedBlock.startsWith(
                                  normalizeFigureCaption(
                                    item.caption
                                  )
                                )
                            );

                          if (figure) {
                            const remainingText =
                              splitCaptionPrefix(
                                block,
                                figure
                              );

                            return (
                              <div
                                key={`${figure.image}-${index}`}
                                className="article-figure-block"
                              >
                                <figure className="article-reader-figure">
                                  <img
                                    src={
                                      figure.image
                                    }
                                    alt={
                                      figure.caption
                                    }
                                    loading="lazy"
                                  />

                                  <figcaption>
                                    {
                                      figure.caption
                                    }
                                  </figcaption>
                                </figure>

                                {remainingText ? (
                                  <p>
                                    {
                                      remainingText
                                    }
                                  </p>
                                ) : null}
                              </div>
                            );
                          }

                          /*
                           * ARTICLE HEADING
                           */
                          if (
                            isArticleHeading(
                              block
                            )
                          ) {
                            return (
                              <h2
                                id={headingId(
                                  block,
                                  index
                                )}
                                key={`${block}-${index}`}
                              >
                                {block}
                              </h2>
                            );
                          }

                          /*
                           * NORMAL PARAGRAPH
                           */
                          paragraphIndex += 1;

                          /*
                           * Check whether an automatic
                           * document image should appear
                           * after this paragraph.
                           */
                          const shouldInsertImage =
                            automaticImages.length &&
                            automaticImageIndex <
                              automaticImages.length &&
                            paragraphIndex ===
                              (automaticImageIndex +
                                1) *
                                imageInterval;

                          /*
                           * Automatic image insertion.
                           *
                           * The paragraph is rendered first,
                           * then the related document image.
                           */
                          if (
                            shouldInsertImage
                          ) {
                            const image =
                              automaticImages[
                                automaticImageIndex
                              ];

                            automaticImageIndex += 1;

                            return (
                              <div
                                key={`${block.slice(
                                  0,
                                  40
                                )}-${index}`}
                              >
                                <p
                                  className={
                                    paragraphIndex ===
                                    1
                                      ? "article-lede"
                                      : undefined
                                  }
                                >
                                  {block}
                                </p>

                                <figure className="article-reader-figure">
                                  <img
                                    src={
                                      image.image
                                    }
                                    alt={imageFallbackCaption(
                                      image.filename
                                    )}
                                    loading="lazy"
                                  />

                                  <figcaption>
                                    {imageFallbackCaption(
                                      image.filename
                                    )}
                                  </figcaption>
                                </figure>
                              </div>
                            );
                          }

                          /*
                           * Normal paragraph without
                           * an automatic image.
                           */
                          return (
                            <p
                              key={`${block.slice(
                                0,
                                40
                              )}-${index}`}
                              className={
                                paragraphIndex ===
                                1
                                  ? "article-lede"
                                  : undefined
                              }
                            >
                              {block}
                            </p>
                          );
                        }
                      );
                    })()
                  : null}
              </div>
            </div>

            {/* RIGHT RAIL - related first, then the section list. */}
            <aside className="article-rail">
            {/* RELATED ARTICLES */}
            {relatedArticles.length ? (
              <section
                className="article-related"
                aria-label="Related articles"
              >
                <div>
                  <p className="article-side-kicker">
                    Keep Reading
                  </p>

                  <h2>
                    Related Articles
                  </h2>
                </div>

                <div className="article-related-grid">
                  {relatedArticles.map(
                    (item, index) => (
                      <Link
                        key={item.slug}
                        to={item.href}
                        className={
                          index === 0
                            ? "article-related-card article-related-card--next"
                            : "article-related-card"
                        }
                      >
                        <div
                          className="article-related-card__media"
                          aria-hidden="true"
                        >
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                          />
                        </div>

                        <span>
                          {index === 0
                            ? "Next Article"
                            : item.tag}
                        </span>

                        <b>
                          {item.title}
                        </b>

                        <small>
                          {item.readTime}
                        </small>

                        <ArrowRight className="size-4" />
                      </Link>
                    )
                  )}
                </div>
              </section>
            ) : null}

              {tableOfContents.length ? (
                <nav
                  className="article-contents-panel"
                  aria-label="Article sections"
                >
                  <p className="article-side-kicker">
                    In This Article
                  </p>

                  <div className="article-toc">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </nav>
              ) : null}
            </aside>
          </div>

        </article>
      </div>
    </section>
  );
}