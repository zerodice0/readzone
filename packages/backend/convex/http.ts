import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { WebhookEvent } from '@clerk/backend';
import { Webhook } from 'svix';

const http = httpRouter();

/**
 * Clerk Webhook 엔드포인트
 * user.created, user.updated, user.deleted 이벤트 처리
 */
http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const event = await validateClerkWebhook(request);
    if (!event) {
      return new Response('Invalid webhook signature', { status: 400 });
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const {
          id,
          first_name,
          last_name,
          image_url,
          email_addresses,
          username,
        } = event.data;

        // 이름 조합 (first_name + last_name 또는 username)
        const name =
          [first_name, last_name].filter(Boolean).join(' ') ||
          username ||
          undefined;

        // 기본 이메일 주소 추출
        const primaryEmail = email_addresses?.find(
          (e) => e.id === event.data.primary_email_address_id
        );
        const email =
          primaryEmail?.email_address ?? email_addresses?.[0]?.email_address;

        await ctx.runMutation(internal.users.upsertFromClerk, {
          clerkUserId: id,
          name,
          imageUrl: image_url ?? undefined,
          email,
          username: username ?? undefined,
        });
        break;
      }

      case 'user.deleted': {
        const clerkUserId = event.data.id;
        if (clerkUserId) {
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkUserId,
          });
        }
        break;
      }

      default:
        console.log('Ignored Clerk webhook event:', event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

/**
 * Svix를 사용한 Clerk Webhook 서명 검증
 */
async function validateClerkWebhook(
  req: Request
): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET environment variable is not set');
    return null;
  }

  const payloadString = await req.text();
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  const wh = new Webhook(webhookSecret);
  try {
    return wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (error) {
    console.error('Error verifying Clerk webhook:', error);
    return null;
  }
}

/**
 * OG 메타데이터 API 엔드포인트
 * 소셜 미디어 크롤러가 리뷰 공유 시 썸네일/설명을 가져갈 수 있도록 제공
 */
http.route({
  pathPrefix: '/og/reviews/',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const reviewId = pathParts[pathParts.length - 1];

    if (!reviewId) {
      return new Response(JSON.stringify({ error: 'Review ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const ogMeta = await ctx.runQuery(internal.reviews.getForOg, {
      id: reviewId,
    });

    if (!ogMeta) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify(ogMeta), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
      },
    });
  }),
});

/**
 * 책 OG 메타데이터 API 엔드포인트
 * 소셜 미디어 크롤러가 책 페이지 공유 시 썸네일/설명을 가져갈 수 있도록 제공
 */
http.route({
  pathPrefix: '/og/books/',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookId = pathParts[pathParts.length - 1];

    if (!bookId) {
      return new Response(JSON.stringify({ error: 'Book ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const ogMeta = await ctx.runQuery(internal.books.getForOg, {
      id: bookId,
    });

    if (!ogMeta) {
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify(ogMeta), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
      },
    });
  }),
});

/**
 * 동적 사이트맵 생성 엔드포인트
 * 정적 페이지 + 모든 PUBLISHED 리뷰 + 모든 책 페이지 포함
 */
http.route({
  path: '/sitemap.xml',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const siteUrl = 'https://readzone.org';
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    // 정적 페이지
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/feed', priority: '0.9', changefreq: 'daily' },
      { loc: '/explore', priority: '0.8', changefreq: 'daily' },
      { loc: '/search', priority: '0.7', changefreq: 'weekly' },
    ];

    // 동적 페이지: 리뷰
    const reviews = await ctx.runQuery(internal.reviews.listForSitemap, {});

    // 동적 페이지: 책
    const books = await ctx.runQuery(internal.books.listForSitemap, {});

    // XML 생성
    const urlEntries = [
      // 정적 페이지
      ...staticPages.map(
        (page) => `
  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      ),
      // 리뷰 페이지
      ...reviews.map(
        (review) => `
  <url>
    <loc>${siteUrl}/reviews/${review.id}</loc>
    <lastmod>${new Date(review.lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      ),
      // 책 페이지
      ...books.map(
        (book) => `
  <url>
    <loc>${siteUrl}/books/${book.id}</loc>
    <lastmod>${new Date(book.lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
      ),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
      },
    });
  }),
});

export default http;
