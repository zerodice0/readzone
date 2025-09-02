import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, DraftsController],
  providers: [ReviewsService, DraftsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
