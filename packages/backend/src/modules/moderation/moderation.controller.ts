import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOnly, ModeratorOnly } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { ReviewReportDto, GetReportsDto } from './dto/review-report.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

interface UserPayload {
  id: string;
  userid: string;
  email: string;
  nickname: string;
}

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // ==================== 일반 사용자 엔드포인트 ====================

  /**
   * 신고 생성
   */
  @Post('reports')
  async createReport(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateReportDto,
  ) {
    const report = await this.moderationService.createReport(user.id, dto);

    return {
      success: true,
      message: '신고가 접수되었습니다.',
      report,
    };
  }

  /**
   * 내가 작성한 신고 목록 조회
   */
  @Get('reports/my')
  async getMyReports(
    @CurrentUser() user: UserPayload,
    @Query() dto: GetReportsDto,
  ) {
    return this.moderationService.getMyReports(user.id, dto);
  }

  /**
   * 사용자 차단
   */
  @Post('blocks')
  async blockUser(@CurrentUser() user: UserPayload, @Body() dto: BlockUserDto) {
    const block = await this.moderationService.blockUser(user.id, dto);

    return {
      success: true,
      message: '사용자를 차단했습니다.',
      block,
    };
  }

  /**
   * 사용자 차단 해제
   */
  @Delete('blocks/:blockedId')
  async unblockUser(
    @CurrentUser() user: UserPayload,
    @Param('blockedId') blockedId: string,
  ) {
    return this.moderationService.unblockUser(user.id, blockedId);
  }

  /**
   * 내가 차단한 사용자 목록
   */
  @Get('blocks/my')
  async getMyBlocks(@CurrentUser() user: UserPayload) {
    const blocks = await this.moderationService.getMyBlocks(user.id);

    return {
      success: true,
      blocks,
    };
  }

  // ==================== 관리자 전용 엔드포인트 ====================

  /**
   * 모든 신고 목록 조회 (중급 관리자 이상)
   */
  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @ModeratorOnly()
  async getAllReports(@Query() dto: GetReportsDto) {
    return this.moderationService.getAllReports(dto);
  }

  /**
   * 신고 검토 (중급 관리자 이상)
   */
  @Patch('admin/reports/:reportId')
  @UseGuards(RolesGuard)
  @ModeratorOnly()
  async reviewReport(
    @CurrentUser() user: UserPayload,
    @Param('reportId') reportId: string,
    @Body() dto: ReviewReportDto,
  ) {
    const report = await this.moderationService.reviewReport(
      user.id,
      reportId,
      dto,
    );

    return {
      success: true,
      message: '신고 검토가 완료되었습니다.',
      report,
    };
  }

  /**
   * 사용자 정지 (관리자 전용)
   */
  @Post('admin/users/:userId/suspend')
  @UseGuards(RolesGuard)
  @AdminOnly()
  async suspendUser(
    @CurrentUser() user: UserPayload,
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    const suspendedUser = await this.moderationService.suspendUser(
      user.id,
      userId,
      dto,
    );

    return {
      success: true,
      message: dto.isSuspended
        ? '사용자가 정지되었습니다.'
        : '사용자 정지가 해제되었습니다.',
      user: suspendedUser,
    };
  }

  /**
   * 위반 사항 조회 (관리자 전용)
   */
  @Get('admin/users/:userId/violations')
  @UseGuards(RolesGuard)
  @AdminOnly()
  async getUserViolations(@Param('userId') userId: string) {
    const violations = await this.moderationService.getUserViolations(userId);

    return {
      success: true,
      violations,
    };
  }
}
