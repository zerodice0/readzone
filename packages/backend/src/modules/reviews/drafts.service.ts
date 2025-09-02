import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UpsertDraftInput {
  userId: string;
  bookId?: string;
  title?: string;
  contentHtml: string;
  contentJson: string;
  isRecommended?: boolean;
  visibility?: string;
  tags?: string[];
}

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertLatestDraft(input: UpsertDraftInput) {
    const existing = await this.prisma.reviewDraft.findFirst({
      where: { userId: input.userId },
      orderBy: { updatedAt: 'desc' },
    });

    const tagsJson = input.tags ? JSON.stringify(input.tags) : null;

    const draft = existing
      ? await this.prisma.reviewDraft.update({
          where: { id: existing.id },
          data: {
            bookId: input.bookId,
            title: input.title,
            contentHtml: input.contentHtml,
            contentJson: input.contentJson,
            isRecommended: input.isRecommended,
            visibility: input.visibility,
            tags: tagsJson,
          },
        })
      : await this.prisma.reviewDraft.create({
          data: {
            userId: input.userId,
            bookId: input.bookId,
            title: input.title,
            contentHtml: input.contentHtml,
            contentJson: input.contentJson,
            isRecommended: input.isRecommended,
            visibility: input.visibility,
            tags: tagsJson,
          },
        });

    return {
      success: true,
      data: {
        draft: {
          ...draft,
          createdAt: draft.createdAt.toISOString(),
          updatedAt: draft.updatedAt.toISOString(),
        },
      },
    };
  }

  async getLatestDraft(userId: string) {
    const draft = await this.prisma.reviewDraft.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: {
        draft: draft
          ? {
              ...draft,
              createdAt: draft.createdAt.toISOString(),
              updatedAt: draft.updatedAt.toISOString(),
            }
          : null,
      },
    };
  }

  async deleteDraft(userId: string, draftId: string) {
    await this.prisma.reviewDraft.delete({ where: { id: draftId } });
    return { success: true };
  }
}
