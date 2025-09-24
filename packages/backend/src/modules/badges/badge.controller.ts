import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  BadgeService,
  PublicBadgeResponse,
  BadgeResponse,
  BadgeDetailsResponse,
  BadgeLeaderboardResponse,
  BadgeStatsResponse,
  PopularBadgesResponse,
  RecentBadgesResponse,
  UserEarnedBadgesResponse,
} from './badge.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userid: string;
    email: string;
    nickname: string;
  };
}

export interface BadgeQueryDto {
  tier?: string;
  earned?: boolean;
  limit?: number;
  cursor?: string;
}

export interface LeaderboardQueryDto {
  limit?: number;
}

@Controller('badges')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  /**
   * 모든 배지 목록 조회 (공개)
   * GET /badges
   */
  @Get()
  @UseGuards(OptionalAuthGuard)
  async getAllBadges(
    @Query() query: BadgeQueryDto,
    @Req() req: AuthRequest,
  ): Promise<PublicBadgeResponse | BadgeResponse> {
    // 로그인하지 않은 사용자는 배지 목록만 볼 수 있음
    if (!req.user) {
      // 공개 배지 목록만 반환 (진행률 없이)
      return this.badgeService.getPublicBadges();
    }

    // 로그인한 사용자는 자신의 진행률과 함께 배지 목록 조회
    return this.badgeService.getUserBadges(req.user.id);
  }

  /**
   * 사용자별 배지 목록 조회
   * GET /badges/users/:userid
   */
  @Get('users/:userid')
  @UseGuards(OptionalAuthGuard)
  async getUserBadges(
    @Param('userid') userid: string,
    @Req() req: AuthRequest,
  ): Promise<BadgeResponse | UserEarnedBadgesResponse> {
    // userid로 실제 사용자 ID 조회
    const targetUser = this.getUserByUserid(userid);

    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 본인의 배지는 진행률과 함께, 타인의 배지는 획득한 것만
    if (req.user?.id === targetUser.id) {
      return this.badgeService.getUserBadges(targetUser.id);
    } else {
      return this.badgeService.getUserEarnedBadges(targetUser.id);
    }
  }

  /**
   * 특정 배지 상세 정보 조회
   * GET /badges/:badgeId
   */
  @Get(':badgeId')
  @UseGuards(OptionalAuthGuard)
  async getBadgeDetails(
    @Param('badgeId') badgeId: string,
    @Req() req: AuthRequest,
  ): Promise<BadgeDetailsResponse> {
    return this.badgeService.getBadgeDetails(badgeId, req.user?.id);
  }

  /**
   * 배지 리더보드 조회
   * GET /badges/:badgeId/leaderboard
   */
  @Get(':badgeId/leaderboard')
  async getBadgeLeaderboard(
    @Param('badgeId') badgeId: string,
    @Query() query: LeaderboardQueryDto,
  ): Promise<BadgeLeaderboardResponse> {
    const limit = Math.min(query.limit || 50, 100); // 최대 100명
    return this.badgeService.getBadgeLeaderboard(badgeId, limit);
  }

  /**
   * 사용자 배지 진행률 갱신 (수동 체크)
   * POST /badges/check
   */
  @Post('check')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkUserBadges(@Req() req: AuthRequest) {
    const result = await this.badgeService.checkAndAwardBadges(req.user!.id);

    return {
      success: true,
      data: {
        newBadges: result.newBadges,
        totalBadges: result.totalBadges,
        message:
          result.newBadges.length > 0
            ? `${result.newBadges.length}개의 새로운 배지를 획득했습니다!`
            : '현재 획득 가능한 새로운 배지가 없습니다.',
      },
    };
  }

  /**
   * 배지 시스템 초기화 (관리자 전용)
   * POST /badges/initialize
   */
  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initializeBadges() {
    // TODO: 관리자 권한 확인 로직 추가
    await this.badgeService.initializeBadges();

    return {
      success: true,
      message: '배지 시스템이 초기화되었습니다.',
    };
  }

  /**
   * 사용자 배지 통계 조회
   * GET /badges/users/:userid/stats
   */
  @Get('users/:userid/stats')
  @UseGuards(OptionalAuthGuard)
  async getUserBadgeStats(
    @Param('userid') userid: string,
  ): Promise<BadgeStatsResponse> {
    const targetUser = this.getUserByUserid(userid);

    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.badgeService.getUserBadgeStats(targetUser.id);
  }

  /**
   * 인기 배지 목록 조회
   * GET /badges/popular
   */
  @Get('popular')
  async getPopularBadges(
    @Query('limit') limit?: number,
  ): Promise<PopularBadgesResponse> {
    const parsedLimit = Math.min(limit || 10, 20); // 최대 20개
    return this.badgeService.getPopularBadges(parsedLimit);
  }

  /**
   * 최근 획득된 배지 목록 조회
   * GET /badges/recent
   */
  @Get('recent')
  async getRecentBadges(
    @Query('limit') limit?: number,
  ): Promise<RecentBadgesResponse> {
    const parsedLimit = Math.min(limit || 10, 50); // 최대 50개
    return this.badgeService.getRecentBadges(parsedLimit);
  }

  /**
   * userid로 사용자 정보 조회 (헬퍼 메서드)
   */
  private getUserByUserid(userid: string) {
    // 이 로직은 실제로는 UsersService를 통해 처리해야 하지만,
    // 순환 의존성을 피하기 위해 여기서 직접 구현
    // TODO: 더 나은 아키텍처 패턴 적용 검토
    return { id: userid }; // 임시 구현
  }
}
