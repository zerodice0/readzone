import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews/drafts')
@UseGuards(JwtAuthGuard)
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  async upsert(
    @Body()
    body: {
      bookId?: string;
      title?: string;
      contentHtml: string;
      isRecommended?: boolean;
      visibility?: 'public' | 'followers' | 'private';
      tags?: string[];
    },
    @Request() req: { user: { id: string } },
  ) {
    return this.draftsService.upsertLatestDraft({
      userId: req.user.id,
      bookId: body.bookId,
      title: body.title,
      contentHtml: body.contentHtml,
      isRecommended: body.isRecommended,
      visibility: body.visibility,
      tags: body.tags,
    });
  }

  @Get('latest')
  async latest(@Request() req: { user: { id: string } }) {
    return this.draftsService.getLatestDraft(req.user.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.draftsService.deleteDraft(req.user.id, id);
  }
}
