/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker - OG 메타 태그 동적 주입
 *
 * 소셜 미디어 크롤러(Facebook, Twitter, Kakao 등)가 리뷰 페이지를 요청할 때
 * 동적으로 OG 메타 태그가 포함된 HTML을 반환합니다.
 * 일반 사용자는 기존 SPA로 리다이렉트됩니다.
 */

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  CONVEX_URL: string;
}

interface OgMeta {
  title: string;
  description: string;
  image: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  authorName: string;
}

// 소셜 미디어 크롤러 User-Agent 목록
const BOT_USER_AGENTS = [
  'facebookexternalhit', // Facebook
  'Facebot', // Facebook
  'Twitterbot', // Twitter/X
  'kakaotalk-scrap', // KakaoTalk
  'kakaostory-og-reader', // KakaoStory
  'Slackbot', // Slack
  'LinkedInBot', // LinkedIn
  'Discordbot', // Discord
  'TelegramBot', // Telegram
  'WhatsApp', // WhatsApp
  'PinterestBot', // Pinterest
  'Googlebot', // Google (SEO)
  'bingbot', // Bing (SEO)
  'YandexBot', // Yandex (SEO)
  'DuckDuckBot', // DuckDuckGo (SEO)
];

/**
 * 소셜 미디어 크롤러인지 확인
 */
function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot.toLowerCase()));
}

/**
 * 리뷰 페이지 경로인지 확인
 * 예: /reviews/abc123def456
 */
function isReviewPage(pathname: string): boolean {
  return /^\/reviews\/[a-z0-9]+$/i.test(pathname);
}

/**
 * 리뷰 ID 추출
 */
function extractReviewId(pathname: string): string | null {
  const match = pathname.match(/^\/reviews\/([a-z0-9]+)$/i);
  return match ? match[1] : null;
}

/**
 * HTML 특수문자 이스케이프 (XSS 방지)
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * OG 메타 태그가 포함된 HTML 생성
 * 봇에게 완전한 콘텐츠를 제공하여 SEO 최적화
 */
function generateOgHtml(meta: OgMeta, url: string, siteUrl: string): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const authorName = escapeHtml(meta.authorName);
  const bookTitle = meta.bookTitle ? escapeHtml(meta.bookTitle) : '';
  const bookAuthor = meta.bookAuthor ? escapeHtml(meta.bookAuthor) : '';

  // OG 이미지: 책 표지 또는 기본 이미지
  const ogImage = meta.image || `${siteUrl}/og-default.png`;
  const ogImageAlt = bookTitle
    ? `『${bookTitle}』 표지`
    : 'ReadZone - 독후감 공유 플랫폼';

  // 구조화된 설명
  const fullDescription = bookTitle
    ? `${description} - 『${bookTitle}』 by ${bookAuthor}`
    : description;

  // 책 정보 HTML (있는 경우에만)
  const bookInfoHtml = bookTitle
    ? `
      <section class="book-info">
        <h2>책 정보</h2>
        <p><strong>제목:</strong> ${bookTitle}</p>
        ${bookAuthor ? `<p><strong>저자:</strong> ${bookAuthor}</p>` : ''}
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - ReadZone</title>

  <!-- Primary Meta Tags -->
  <meta name="title" content="${title} - ReadZone">
  <meta name="description" content="${fullDescription}">
  <meta name="author" content="${authorName}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${fullDescription}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:alt" content="${ogImageAlt}">
  <meta property="og:site_name" content="ReadZone">
  <meta property="og:locale" content="ko_KR">
  <meta property="article:author" content="${authorName}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(url)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${fullDescription}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${ogImageAlt}">

  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHtml(url)}">

  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: #fafafa;
      color: #333;
    }
    header { margin-bottom: 2rem; }
    h1 { font-size: 1.75rem; color: #1a1a1a; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
    .book-info {
      background: #f0f0f0;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .book-info h2 { font-size: 1rem; margin: 0 0 0.5rem 0; }
    .book-info p { margin: 0.25rem 0; font-size: 0.875rem; }
    article { margin-bottom: 2rem; }
    .description { font-size: 1rem; color: #444; }
    .cta {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
    .cta:hover { background: #4338ca; }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e5e5;
      font-size: 0.875rem;
      color: #666;
    }
    footer a { color: #4f46e5; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p class="meta">작성자: ${authorName}</p>
  </header>

  ${bookInfoHtml}

  <article>
    <p class="description">${description}</p>
  </article>

  <a href="${escapeHtml(url)}" class="cta">전체 리뷰 보기</a>

  <footer>
    <p><a href="${siteUrl}">ReadZone</a> - 독후감을 공유하고 다른 독자들의 생각을 확인하세요</p>
  </footer>

  <noscript>
    <p>이 페이지의 전체 내용을 보려면 <a href="${escapeHtml(url)}">여기를 클릭</a>하세요.</p>
  </noscript>
</body>
</html>`;
}

/**
 * 기본 OG HTML (리뷰를 찾을 수 없는 경우)
 */
function generateDefaultOgHtml(url: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ReadZone - 독후감 공유 플랫폼</title>

  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="ReadZone - 독후감 공유 플랫폼">
  <meta property="og:description" content="독후감을 공유하고 다른 독자들의 생각을 확인하세요">
  <meta property="og:image" content="${siteUrl}/og-default.png">
  <meta property="og:site_name" content="ReadZone">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="ReadZone - 독후감 공유 플랫폼">
  <meta name="twitter:description" content="독후감을 공유하고 다른 독자들의 생각을 확인하세요">

  <link rel="canonical" href="${escapeHtml(url)}">

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    h1 { color: #1a1a1a; }
    p { color: #666; }
    a { color: #4f46e5; }
  </style>
</head>
<body>
  <h1>ReadZone</h1>
  <p>독후감을 공유하고 다른 독자들의 생각을 확인하세요</p>
  <p><a href="${siteUrl}">ReadZone 홈으로 이동</a></p>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const siteUrl = `${url.protocol}//${url.host}`;

    // sitemap.xml 요청은 Convex HTTP API로 프록시
    if (url.pathname === '/sitemap.xml') {
      try {
        const sitemapResponse = await fetch(`${env.CONVEX_URL}/sitemap.xml`, {
          headers: {
            Accept: 'application/xml',
          },
        });

        if (sitemapResponse.ok) {
          const sitemap = await sitemapResponse.text();
          return new Response(sitemap, {
            status: 200,
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
            },
          });
        }
      } catch (error) {
        console.error('Failed to fetch sitemap:', error);
      }

      // Convex에서 실패하면 정적 자산으로 폴백
      return env.ASSETS.fetch(request);
    }

    // 봇이고 리뷰 페이지인 경우에만 OG HTML 반환
    if (isBot(userAgent) && isReviewPage(url.pathname)) {
      const reviewId = extractReviewId(url.pathname);

      if (reviewId) {
        try {
          // Convex HTTP API에서 OG 메타데이터 조회
          const ogResponse = await fetch(
            `${env.CONVEX_URL}/og/reviews/${reviewId}`,
            {
              headers: {
                Accept: 'application/json',
              },
            }
          );

          if (ogResponse.ok) {
            const meta: OgMeta = await ogResponse.json();
            const html = generateOgHtml(meta, url.href, siteUrl);

            return new Response(html, {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
              },
            });
          }
        } catch (error) {
          console.error('Failed to fetch OG metadata:', error);
        }
      }

      // 메타데이터 조회 실패 시 기본 OG HTML 반환
      const defaultHtml = generateDefaultOgHtml(url.href, siteUrl);
      return new Response(defaultHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 일반 사용자는 정적 자산 서빙 (SPA)
    return env.ASSETS.fetch(request);
  },
};
