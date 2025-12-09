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
  path: '/og/reviews/{reviewId}',
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

export default http;
