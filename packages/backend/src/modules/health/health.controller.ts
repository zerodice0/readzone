import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service';
import { success } from '../../common/utils/response';

/**
 * Health check controller
 * Provides health status endpoint for monitoring
 */
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService
  ) {}

  /**
   * GET /api/v1/health
   * Returns health status of the application and its dependencies
   */
  @Get()
  async check() {
    const health = await this.healthService.check();
    return success(health);
  }
}
