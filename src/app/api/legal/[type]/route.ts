import { NextRequest, NextResponse } from 'next/server';

// 약관 내용을 HTML 형식으로 반환
const termsContent = `
<h2>제1조 (목적)</h2>
<p>이 약관은 ReadZone(이하 "서비스")이 제공하는 독서 커뮤니티 서비스의 이용과 관련하여 서비스와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

<h2>제2조 (정의)</h2>
<ol>
  <li>"서비스"란 ReadZone이 제공하는 독서 후 의견 공유 플랫폼을 의미합니다.</li>
  <li>"회원"이란 서비스에 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 이용할 수 있는 자를 말합니다.</li>
  <li>"독후감"이란 회원이 읽은 책에 대한 감상과 의견을 작성한 게시물을 의미합니다.</li>
  <li>"도서 의견"이란 특정 도서에 대한 280자 이내의 간단한 의견을 의미합니다.</li>
</ol>

<h2>제3조 (약관의 효력 및 변경)</h2>
<ol>
  <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.</li>
  <li>서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 회원에게 공지됩니다.</li>
  <li>회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
</ol>

<h2>제4조 (회원가입)</h2>
<ol>
  <li>회원가입은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입 신청을 하고 서비스가 이를 승낙함으로써 체결됩니다.</li>
  <li>회원가입 시 제공하는 정보는 정확해야 하며, 허위 정보 기재 시 서비스 이용이 제한될 수 있습니다.</li>
  <li>만 14세 미만의 아동은 회원가입을 할 수 없습니다.</li>
</ol>

<h2>제5조 (서비스의 제공)</h2>
<ol>
  <li>서비스는 다음과 같은 서비스를 제공합니다:
    <ul>
      <li>독후감 작성 및 공유</li>
      <li>도서 검색 및 정보 제공</li>
      <li>도서별 의견 작성 (280자)</li>
      <li>다른 회원의 콘텐츠에 대한 좋아요, 댓글 기능</li>
      <li>독서 관련 커뮤니티 기능</li>
    </ul>
  </li>
  <li>서비스는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다.</li>
</ol>

<p class="text-sm text-gray-500 mt-4">전체 약관은 회원가입 후 설정 페이지에서 확인하실 수 있습니다.</p>
`;

const privacyContent = `
<p class="text-sm text-gray-600 mb-4">시행일: 2024년 1월 1일</p>

<h2>1. 수집하는 개인정보 항목</h2>
<h3>필수 수집 항목</h3>
<ul>
  <li>회원가입 시: 이메일 주소, 비밀번호, 닉네임</li>
  <li>서비스 이용 시: 서비스 이용 기록, 접속 로그, 쿠키</li>
</ul>

<h3>선택 수집 항목</h3>
<ul>
  <li>프로필 설정 시: 프로필 이미지, 자기소개</li>
  <li>독후감 작성 시: 도서 구매 링크</li>
</ul>

<h2>2. 개인정보의 수집 및 이용목적</h2>
<ul>
  <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
  <li>회원자격 유지·관리</li>
  <li>서비스 부정이용 방지</li>
  <li>각종 고지·통지</li>
  <li>고충처리 등 민원처리</li>
  <li>서비스 이용에 대한 통계 분석</li>
  <li>맞춤형 서비스 제공</li>
</ul>

<h2>3. 개인정보의 보유 및 이용기간</h2>
<p>서비스는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>

<h3>회사 내부 방침에 의한 정보 보유</h3>
<ul>
  <li>부정이용 기록: 1년</li>
  <li>탈퇴 회원 정보: 30일 (복구 요청에 대비)</li>
</ul>

<h2>4. 개인정보의 파기절차 및 방법</h2>
<p>이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</p>

<p class="text-sm text-gray-500 mt-4">전체 개인정보처리방침은 회원가입 후 설정 페이지에서 확인하실 수 있습니다.</p>
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  if (type === 'terms') {
    return new NextResponse(termsContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } else if (type === 'privacy') {
    return new NextResponse(privacyContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}