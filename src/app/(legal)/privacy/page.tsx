export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <p className="text-sm text-gray-600 mb-4">시행일: 2024년 1월 1일</p>
          <p>
            ReadZone(이하 "서비스")은 이용자의 개인정보를 중요시하며, 
            「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 
            본 개인정보처리방침은 이용자의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 
            개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. 수집하는 개인정보 항목</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">필수 수집 항목</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>회원가입 시: 이메일 주소, 비밀번호, 닉네임</li>
                <li>서비스 이용 시: 서비스 이용 기록, 접속 로그, 쿠키</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">선택 수집 항목</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>프로필 설정 시: 프로필 이미지, 자기소개</li>
                <li>독후감 작성 시: 도서 구매 링크</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 개인정보의 수집 및 이용목적</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
            <li>회원자격 유지·관리</li>
            <li>서비스 부정이용 방지</li>
            <li>각종 고지·통지</li>
            <li>고충처리 등 민원처리</li>
            <li>서비스 이용에 대한 통계 분석</li>
            <li>맞춤형 서비스 제공</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. 개인정보의 보유 및 이용기간</h2>
          <p className="mb-4">
            서비스는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
            단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">회사 내부 방침에 의한 정보 보유</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>부정이용 기록: 1년</li>
                <li>탈퇴 회원 정보: 30일 (복구 요청에 대비)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">관련 법령에 의한 정보 보유</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>표시·광고에 관한 기록: 6개월</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. 개인정보의 파기절차 및 방법</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">파기절차</h3>
              <p>
                이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 
                일정기간 저장된 후 혹은 즉시 파기됩니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">파기방법</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. 개인정보의 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
            다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-4">
            <li>이용자들이 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. 개인정보의 위탁처리</h2>
          <p>
            서비스는 서비스 향상을 위해서 아래와 같이 개인정보를 위탁하고 있으며, 
            관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              현재 개인정보 처리 위탁 업체는 없습니다. 
              향후 위탁 업체가 발생할 경우 본 방침을 통해 공지하겠습니다.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. 이용자의 권리와 그 행사방법</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
            <li>이용자는 언제든지 개인정보의 수집 및 이용에 대한 동의를 철회(회원탈퇴)할 수 있습니다.</li>
            <li>만 14세 미만 아동의 경우 법정대리인이 아동의 개인정보 조회, 수정 및 삭제를 요청할 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. 개인정보의 안전성 확보 조치</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>비밀번호의 암호화: 이용자의 비밀번호는 암호화되어 저장 및 관리됩니다.</li>
            <li>해킹 등에 대비한 대책: 해킹이나 컴퓨터 바이러스 등에 의해 개인정보가 유출되거나 훼손되는 것을 막기 위해 최선을 다하고 있습니다.</li>
            <li>개인정보처리시스템 접근 제한: 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위한 필요한 조치를 하고 있습니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
          <p>
            서비스는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">쿠키의 사용 목적</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>로그인 유지</li>
                <li>이용자의 사용 패턴 분석</li>
                <li>서비스 개선을 위한 통계 활용</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">쿠키의 설치·운영 및 거부</h3>
              <p>
                이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 
                웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 저장될 때마다 확인을 거치거나, 거부할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. 개인정보보호책임자</h2>
          <div className="p-4 bg-gray-50 rounded">
            <p className="font-medium mb-2">개인정보보호책임자</p>
            <ul className="space-y-1 text-sm">
              <li>성명: 홍길동</li>
              <li>직책: 개인정보보호 담당자</li>
              <li>연락처: privacy@readzone.com</li>
            </ul>
          </div>
          <p className="mt-4">
            기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
            <li>개인정보분쟁조정위원회 (kopico.kisa.or.kr / 1833-6972)</li>
            <li>대검찰청 사이버수사과 (spo.gov.kr / 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 182)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">11. 개인정보처리방침의 변경</h2>
          <p>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
            변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>
      </div>
    </div>
  );
}