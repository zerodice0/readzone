export class DataExportResponseDto {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: 'json' | 'csv';
}
