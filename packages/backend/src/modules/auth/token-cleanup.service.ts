import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * TokenCleanupService - 리프레시 토큰 생명주기 관리 서비스
 *
 * ## 개요
 * JWT 리프레시 토큰의 자동 정리를 담당하는 스케줄링 서비스입니다.
 * 데이터베이스에 누적되는 만료된/취소된 토큰을 정기적으로 정리하여
 * 데이터베이스 성능과 스토리지 효율성을 유지합니다.
 *
 * ## 토큰 정리 정책
 *
 * ### 만료된 토큰 (Expired Tokens)
 * - **보관 기간**: 7일
 * - **정리 주기**: 매일 자정 (00:00)
 * - **대상**: expiresAt이 7일 이전인 모든 토큰
 * - **목적**: 자연스럽게 만료된 토큰의 데이터베이스 정리
 *
 * ### 취소된 토큰 (Revoked Tokens)
 * - **보관 기간**: 48시간
 * - **정리 주기**: 매 6시간마다
 * - **대상**: isRevoked=true이고 issuedAt이 48시간 이전인 토큰
 * - **목적**: 로그아웃/보안 이벤트로 무효화된 토큰의 빠른 정리
 *
 * ## 스케줄링 전략
 *
 * ### 시간대별 실행 계획
 * - **00:00**: 만료 토큰 정리 (서버 부하가 적은 시간)
 * - **00:00, 06:00, 12:00, 18:00**: 취소 토큰 정리 (정기적 유지보수)
 * - **매주 월요일 02:00**: 토큰 통계 로깅 및 모니터링
 *
 * ### 성능 고려사항
 * - 배치 삭제 사용으로 성능 최적화
 * - 트랜잭션 없이 단순 삭제로 락 최소화
 * - 로깅을 통한 삭제 결과 추적
 *
 * ## 보안 고려사항
 *
 * ### 토큰 보관 최소화
 * - 만료/취소된 토큰의 장기간 보관 방지
 * - 정기적 정리로 데이터 유출 위험 감소
 * - 통계 로깅으로 비정상적 토큰 축적 감지
 *
 * ### 감사 로깅
 * - 모든 정리 작업의 결과를 로깅
 * - 비정상적인 토큰 수량 경고 (1000개 초과시)
 * - 정리 실패 시 에러 로깅으로 신속한 대응 지원
 */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 만료된 토큰 자동 정리 (7일 보관 정책)
   *
   * ## 실행 스케줄
   * - **CRON**: 매일 자정 (00:00)
   * - **빈도**: 1일 1회
   *
   * ## 정리 대상
   * - expiresAt이 현재 시간보다 7일 이전인 모든 토큰
   * - 자연스럽게 만료된 토큰들의 데이터베이스 정리
   *
   * ## 비즈니스 로직
   * 1. 현재 시간에서 7일을 뺀 기준 시간 계산
   * 2. 기준 시간보다 이전에 만료된 토큰들을 배치 삭제
   * 3. 삭제된 토큰 수를 로깅하여 운영 모니터링 지원
   *
   * ## 성능 최적화
   * - deleteMany() 사용으로 배치 삭제 수행
   * - 인덱스가 있는 expiresAt 필드 조건으로 빠른 검색
   * - 트랜잭션 없이 단순 삭제로 데이터베이스 락 최소화
   *
   * ## 에러 처리
   * - 정리 실패 시 에러 로깅 후 서비스 중단 없이 계속 동작
   * - 다음 스케줄 실행시 재시도됨
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    try {
      // 7일 전 기준 시간 계산
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 만료된 토큰 배치 삭제
      const result = await this.prismaService.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      // 정리 결과 로깅 (운영 모니터링용)
      this.logger.log(
        `Cleaned up ${result.count} expired tokens older than 7 days`,
      );
    } catch (error) {
      // 정리 실패 시 에러 로깅, 서비스는 계속 동작
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }

  /**
   * 취소된 토큰 자동 정리 (48시간 보관 정책)
   *
   * ## 실행 스케줄
   * - **CRON**: 매 6시간마다 (00:00, 06:00, 12:00, 18:00)
   * - **빈도**: 하루 4회
   *
   * ## 정리 대상
   * - isRevoked=true이고 issuedAt이 48시간 이전인 토큰
   * - 로그아웃, 보안 이벤트로 무효화된 토큰들
   *
   * ## 비즈니스 로직
   * 1. 현재 시간에서 48시간을 뺀 기준 시간 계산
   * 2. 취소 상태이고 기준 시간보다 이전에 발급된 토큰들을 배치 삭제
   * 3. 삭제된 토큰 수를 로깅하여 보안 모니터링 지원
   *
   * ## 보안 고려사항
   * - 로그아웃된 토큰의 빠른 정리로 보안 위험 최소화
   * - 48시간 보관으로 감사 추적과 보안 분석 시간 확보
   * - 정기적 정리로 취소된 토큰의 장기간 축적 방지
   *
   * ## 성능 최적화
   * - 복합 조건 (isRevoked + issuedAt)으로 정확한 대상 선별
   * - userId 인덱스와 issuedAt 인덱스 활용으로 빠른 검색
   * - 6시간 간격 실행으로 적당한 정리 빈도 유지
   *
   * ## 에러 처리
   * - 정리 실패 시 에러 로깅 후 다음 스케줄에서 재시도
   * - 보안 토큰 정리 실패에 대한 즉각적인 알림 제공
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanupRevokedTokens() {
    try {
      // 48시간 전 기준 시간 계산
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      // 취소된 토큰 배치 삭제 (복합 조건)
      const result = await this.prismaService.refreshToken.deleteMany({
        where: {
          isRevoked: true,
          issuedAt: {
            lt: twoDaysAgo,
          },
        },
      });

      // 정리 결과 로깅 (보안 모니터링용)
      this.logger.log(
        `Cleaned up ${result.count} revoked tokens older than 48 hours`,
      );
    } catch (error) {
      // 보안 관련 정리 실패 시 즉각적인 에러 로깅
      this.logger.error('Failed to cleanup revoked tokens', error);
    }
  }

  /**
   * 토큰 통계 로깅 및 모니터링 (주간 건강성 점검)
   *
   * ## 실행 스케줄
   * - **CRON**: 매주 월요일 새벽 2시 (0 2 * * 1)
   * - **빈도**: 주 1회
   *
   * ## 통계 수집 항목
   * - 전체 토큰 수 (Total Tokens)
   * - 활성 토큰 수 (Active Tokens, isRevoked=false)
   * - 취소된 토큰 수 (Revoked Tokens, isRevoked=true)
   *
   * ## 모니터링 목적
   * 1. **시스템 건강성 점검**: 토큰 시스템의 전반적인 상태 확인
   * 2. **정리 효율성 검증**: 자동 정리 시스템이 올바르게 동작하는지 확인
   * 3. **비정상 패턴 감지**: 토큰 축적이나 시스템 오류 조기 발견
   *
   * ## 경고 시스템
   * - **임계값**: 1000개 이상의 토큰 감지시 경고 로깅
   * - **목적**: 정리 시스템 실패나 비정상적인 사용 패턴 알림
   * - **대응**: 운영팀의 수동 점검 및 조치 유도
   *
   * ## 운영 활용
   * - 주간 운영 리포트 작성 자료
   * - 용량 계획 및 성능 모니터링 지표
   * - 정리 정책 효과성 평가 데이터
   *
   * ## 성능 고려사항
   * - groupBy 쿼리로 효율적인 통계 수집
   * - 주 1회 실행으로 성능 부하 최소화
   * - 새벽 시간 실행으로 서비스 영향도 최소화
   */
  @Cron('0 2 * * 1')
  async logTokenStatistics() {
    try {
      // 토큰 상태별 개수 집계 (isRevoked 기준)
      const stats = await this.prismaService.refreshToken.groupBy({
        by: ['isRevoked'],
        _count: {
          id: true,
        },
      });

      // 전체 토큰 수 조회
      const totalTokens = await this.prismaService.refreshToken.count();

      // 활성/취소 토큰 수 분리
      const activeTokens = stats.find((s) => !s.isRevoked)?._count.id || 0;
      const revokedTokens = stats.find((s) => s.isRevoked)?._count.id || 0;

      // 주간 통계 로깅 (운영 모니터링용)
      this.logger.log(
        `Token statistics - Total: ${totalTokens}, Active: ${activeTokens}, Revoked: ${revokedTokens}`,
      );

      // 비정상적 토큰 축적 감지 및 경고
      if (totalTokens > 1000) {
        this.logger.warn(
          `High token count detected: ${totalTokens} tokens in database. ` +
            `Please check token cleanup system and investigate potential issues.`,
        );
      }
    } catch (error) {
      // 통계 수집 실패 시 에러 로깅
      this.logger.error('Failed to log token statistics', error);
    }
  }

  /**
   * 수동 토큰 정리 (관리자/테스트용) - 향상된 로깅 및 복구 지원
   *
   * ## 사용 목적
   * - **관리자 요청**: 운영 중 필요에 의한 즉시 정리
   * - **시스템 테스트**: 정리 로직 검증 및 개발 환경 테스트
   * - **긴급 정리**: 시스템 부하나 저장 공간 문제 해결
   * - **정리 효과 검증**: 자동 스케줄러 동작 전 수동 확인
   *
   * ## 정리 정책 (Policy)
   * ### 만료된 토큰 정리
   * - **보관 기간**: 7일
   * - **정리 대상**: `expiresAt`이 현재 시간보다 7일 이전인 토큰
   * - **목적**: 자연스럽게 만료된 토큰의 데이터베이스 정리
   *
   * ### 취소된 토큰 정리
   * - **보관 기간**: 48시간
   * - **정리 대상**: `isRevoked=true`이고 `issuedAt`이 48시간 이전인 토큰
   * - **목적**: 로그아웃/보안 이벤트로 무효화된 토큰의 빠른 정리
   *
   * ## 향상된 기능
   * 1. **삭제 전 토큰 조회**: 삭제될 토큰의 상세 정보 수집
   * 2. **로그 파일 저장**: 삭제된 토큰 정보를 JSON 파일로 백업
   * 3. **복구 지원**: 실수로 삭제된 토큰 정보의 수동 복구 가능
   * 4. **상세 로깅**: 삭제된 토큰의 구체적 정보 제공
   *
   * ## 실행 방식
   * 1. **삭제 전 조회**: 삭제 대상 토큰의 상세 정보를 미리 조회
   * 2. **로그 파일 생성**: 삭제될 토큰 정보를 타임스탬프별 파일로 저장
   * 3. **병렬 삭제**: Promise.all로 만료/취소 토큰 동시 정리
   * 4. **결과 검증**: 조회된 개수와 삭제된 개수 일치 여부 확인
   *
   * ## 로그 파일 구조
   * - **위치**: `logs/token-cleanup/`
   * - **파일명**: `cleanup-YYYY-MM-DD_HH-mm-ss.json`
   * - **내용**: 삭제된 토큰의 ID, 사용자 정보, 발급/만료 시간 등
   *
   * ## 반환 데이터
   * @returns {Object} 정리 결과 상세 정보
   * @returns {number} expiredCleaned - 정리된 만료 토큰 수
   * @returns {number} revokedCleaned - 정리된 취소 토큰 수
   * @returns {string} logFile - 생성된 로그 파일 경로
   * @returns {CleanupPolicy} policy - 적용된 정리 정책 정보
   * @returns {TokenDetail[]} expiredTokens - 삭제된 만료 토큰 상세 정보
   * @returns {TokenDetail[]} revokedTokens - 삭제된 취소 토큰 상세 정보
   *
   * ## 에러 처리
   * - 로그 파일 생성 실패 시에도 토큰 정리는 계속 진행
   * - 부분 실패 시 성공한 부분의 결과는 반환
   * - 모든 에러는 상세하게 로깅하여 트러블슈팅 지원
   */
  async manualCleanup(): Promise<{
    expiredCleaned: number;
    revokedCleaned: number;
    logFile?: string;
    policy: {
      expiredTokenRetentionDays: number;
      revokedTokenRetentionHours: number;
      description: string;
    };
    expiredTokens: Array<{
      id: string;
      userId: string;
      issuedAt: string;
      expiresAt: string;
      userAgent?: string | null;
      ip?: string | null;
    }>;
    revokedTokens: Array<{
      id: string;
      userId: string;
      issuedAt: string;
      expiresAt: string;
      revokedAt?: string;
      userAgent?: string | null;
      ip?: string | null;
    }>;
  }> {
    const cleanupStartTime = new Date();
    const timestamp = cleanupStartTime
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    try {
      // 정리 기준 시간 계산
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      // 삭제 전 토큰 상세 정보 조회
      const [expiredTokensToDelete, revokedTokensToDelete] = await Promise.all([
        // 만료된 토큰 조회
        this.prismaService.refreshToken.findMany({
          where: {
            expiresAt: {
              lt: sevenDaysAgo,
            },
          },
          select: {
            id: true,
            userId: true,
            issuedAt: true,
            expiresAt: true,
            userAgent: true,
            ip: true,
          },
        }),
        // 취소된 토큰 조회
        this.prismaService.refreshToken.findMany({
          where: {
            isRevoked: true,
            issuedAt: {
              lt: twoDaysAgo,
            },
          },
          select: {
            id: true,
            userId: true,
            issuedAt: true,
            expiresAt: true,
            userAgent: true,
            ip: true,
          },
        }),
      ]);

      // 로그 파일 생성 (삭제 전 백업)
      let logFilePath: string | undefined;

      if (
        expiredTokensToDelete.length > 0 ||
        revokedTokensToDelete.length > 0
      ) {
        try {
          const logsDir = path.join(process.cwd(), 'logs', 'token-cleanup');
          await fs.mkdir(logsDir, { recursive: true });

          logFilePath = path.join(logsDir, `cleanup-${timestamp}.json`);

          const logData = {
            cleanupTimestamp: cleanupStartTime.toISOString(),
            policy: {
              expiredTokenRetentionDays: 7,
              revokedTokenRetentionHours: 48,
              description:
                '만료된 토큰은 7일 후, 취소된 토큰은 48시간 후 정리됩니다.',
            },
            criteriaTimestamps: {
              expiredTokenCutoff: sevenDaysAgo.toISOString(),
              revokedTokenCutoff: twoDaysAgo.toISOString(),
            },
            tokensToDelete: {
              expired: expiredTokensToDelete.map((token) => ({
                ...token,
                issuedAt: token.issuedAt.toISOString(),
                expiresAt: token.expiresAt.toISOString(),
              })),
              revoked: revokedTokensToDelete.map((token) => ({
                ...token,
                issuedAt: token.issuedAt.toISOString(),
                expiresAt: token.expiresAt.toISOString(),
                revokedAt: undefined, // revokedAt 정보는 현재 스키마에서 추적하지 않음
              })),
            },
            summary: {
              expiredCount: expiredTokensToDelete.length,
              revokedCount: revokedTokensToDelete.length,
              totalCount:
                expiredTokensToDelete.length + revokedTokensToDelete.length,
            },
            instructions: {
              purpose: '이 파일은 토큰 정리 작업의 백업입니다.',
              recovery:
                '실수로 정리된 토큰을 수동으로 복구할 때 이 정보를 사용할 수 있습니다.',
              location: logFilePath,
            },
          };

          await fs.writeFile(
            logFilePath,
            JSON.stringify(logData, null, 2),
            'utf8',
          );

          this.logger.log(`Token cleanup log saved to: ${logFilePath}`);
        } catch (logError) {
          this.logger.warn(`Failed to create cleanup log file: ${logError}`);
          // 로그 파일 생성 실패해도 정리 작업은 계속 진행
        }
      }

      // 만료/취소 토큰 병렬 정리 (성능 최적화)
      const [expiredResult, revokedResult] = await Promise.all([
        // 만료된 토큰 정리 (7일 정책)
        this.prismaService.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: sevenDaysAgo,
            },
          },
        }),
        // 취소된 토큰 정리 (48시간 정책)
        this.prismaService.refreshToken.deleteMany({
          where: {
            isRevoked: true,
            issuedAt: {
              lt: twoDaysAgo,
            },
          },
        }),
      ]);

      // 삭제 결과 검증
      const expiredCountMismatch =
        expiredResult.count !== expiredTokensToDelete.length;
      const revokedCountMismatch =
        revokedResult.count !== revokedTokensToDelete.length;

      if (expiredCountMismatch || revokedCountMismatch) {
        this.logger.warn(
          `Token count mismatch - Expired: expected ${expiredTokensToDelete.length}, deleted ${expiredResult.count}; ` +
            `Revoked: expected ${revokedTokensToDelete.length}, deleted ${revokedResult.count}`,
        );
      }

      // 수동 정리 결과 로깅 (운영 추적용)
      this.logger.log(
        `Manual cleanup completed - Expired: ${expiredResult.count}, Revoked: ${revokedResult.count}` +
          (logFilePath ? `, Log: ${path.basename(logFilePath)}` : ''),
      );

      if (expiredResult.count > 0 || revokedResult.count > 0) {
        this.logger.log(
          `Token cleanup policy applied - Expired tokens older than 7 days, Revoked tokens older than 48 hours`,
        );
      }

      // 정리 결과 반환 (API 응답 및 통계용)
      return {
        expiredCleaned: expiredResult.count,
        revokedCleaned: revokedResult.count,
        logFile: logFilePath,
        policy: {
          expiredTokenRetentionDays: 7,
          revokedTokenRetentionHours: 48,
          description:
            '만료된 토큰은 7일 후, 취소된 토큰은 48시간 후 정리됩니다.',
        },
        expiredTokens: expiredTokensToDelete.map((token) => ({
          id: token.id,
          userId: token.userId,
          issuedAt: token.issuedAt.toISOString(),
          expiresAt: token.expiresAt.toISOString(),
          userAgent: token.userAgent,
          ip: token.ip,
        })),
        revokedTokens: revokedTokensToDelete.map((token) => ({
          id: token.id,
          userId: token.userId,
          issuedAt: token.issuedAt.toISOString(),
          expiresAt: token.expiresAt.toISOString(),
          revokedAt: undefined, // revokedAt 정보는 현재 스키마에서 추적하지 않음
          userAgent: token.userAgent,
          ip: token.ip,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to complete manual token cleanup', error);
      throw error;
    }
  }
}
