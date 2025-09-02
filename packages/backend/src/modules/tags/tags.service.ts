import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(query?: string, limit = 10) {
    const reviews = await this.prisma.review.findMany({
      where: { tags: { not: null } },
      select: { tags: true },
    });

    const counter = new Map<string, number>();
    for (const r of reviews) {
      if (!r.tags) continue;
      try {
        const arr = JSON.parse(r.tags) as string[];
        for (const t of arr) {
          const key = t.trim();
          if (!key) continue;
          counter.set(key, (counter.get(key) ?? 0) + 1);
        }
      } catch {
        // ignore parse errors
      }
    }

    const q = (query ?? '').toLowerCase();
    const items = Array.from(counter.entries())
      .filter(([name]) => (q ? name.toLowerCase().startsWith(q) : true))
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(0, Math.min(limit, 50)))
      .map(([name, count]) => ({ name, count }));

    return { success: true, data: { suggestions: items } };
  }
}
