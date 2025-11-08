import { useState } from 'react';

/**
 * T128: BackupCodesDisplay
 * Display backup codes once after MFA enable
 * Show warning that codes will only be shown once
 */

interface BackupCodesDisplayProps {
  codes: string[];
  onComplete: () => void;
}

function BackupCodesDisplay({ codes, onComplete }: BackupCodesDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codesText = codes.join('\n');
    void navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const codesText = codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readzone-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">백업 코드 저장</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                중요: 백업 코드는 지금 이 화면에서만 표시됩니다
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                인증 앱을 사용할 수 없을 때 이 코드로 로그인할 수 있습니다.
                안전한 곳에 보관하세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
          <div className="grid grid-cols-2 gap-2">
            {codes.map((code, index) => (
              <div
                key={index}
                className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200"
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mb-6">
        <button
          onClick={handleCopy}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? '복사됨!' : '클립보드에 복사'}
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          파일로 다운로드
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>사용 방법:</strong> 각 백업 코드는 한 번만 사용할 수 있습니다.
          로그인 시 인증 코드 대신 백업 코드를 입력하세요.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        백업 코드를 안전하게 저장했습니다
      </button>
    </div>
  );
}

export default BackupCodesDisplay;
