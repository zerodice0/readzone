export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">이용약관</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
          <p>
            이 약관은 ReadZone(이하 "서비스")이 제공하는 독서 커뮤니티 서비스의 이용과 관련하여 
            서비스와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제2조 (정의)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>"서비스"란 ReadZone이 제공하는 독서 후 의견 공유 플랫폼을 의미합니다.</li>
            <li>"회원"이란 서비스에 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 이용할 수 있는 자를 말합니다.</li>
            <li>"독후감"이란 회원이 읽은 책에 대한 감상과 의견을 작성한 게시물을 의미합니다.</li>
            <li>"도서 의견"이란 특정 도서에 대한 280자 이내의 간단한 의견을 의미합니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.</li>
            <li>서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 회원에게 공지됩니다.</li>
            <li>회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제4조 (회원가입)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원가입은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입 신청을 하고 서비스가 이를 승낙함으로써 체결됩니다.</li>
            <li>회원가입 시 제공하는 정보는 정확해야 하며, 허위 정보 기재 시 서비스 이용이 제한될 수 있습니다.</li>
            <li>만 14세 미만의 아동은 회원가입을 할 수 없습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제5조 (서비스의 제공)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스는 다음과 같은 서비스를 제공합니다:
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>독후감 작성 및 공유</li>
                <li>도서 검색 및 정보 제공</li>
                <li>도서별 의견 작성 (280자)</li>
                <li>다른 회원의 콘텐츠에 대한 좋아요, 댓글 기능</li>
                <li>독서 관련 커뮤니티 기능</li>
              </ul>
            </li>
            <li>서비스는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제6조 (회원의 의무)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원은 다음 행위를 하여서는 안 됩니다:
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>타인의 정보 도용</li>
                <li>서비스에 게시된 정보의 무단 변경</li>
                <li>서비스가 정한 정보 이외의 정보 등의 송신 또는 게시</li>
                <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
                <li>음란물, 폭력적 메시지, 기타 공공질서에 위반되는 정보의 공개 또는 게시</li>
                <li>저작권 등 타인의 권리를 침해하는 행위</li>
              </ul>
            </li>
            <li>회원은 관계법령, 본 약관의 규정을 준수해야 합니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제7조 (저작권의 귀속)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 서비스에 귀속됩니다.</li>
            <li>회원이 서비스 내에 게시한 게시물의 저작권은 해당 회원에게 귀속됩니다.</li>
            <li>회원은 서비스를 이용함으로써 얻은 정보를 서비스의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제8조 (게시물의 관리)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원의 게시물이 관련 법령에 위반되는 내용을 포함하는 경우, 권리자는 관련 법령이 정한 절차에 따라 해당 게시물의 게시중단 및 삭제 등을 요청할 수 있습니다.</li>
            <li>서비스는 전항에 따른 권리자의 요청이 없는 경우라도 권리침해가 인정될 만한 사유가 있거나 기타 서비스 정책 및 관련법에 위반되는 경우에는 관련 게시물에 대해 임시조치 등을 취할 수 있습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제9조 (서비스 이용의 제한)</h2>
          <p>
            서비스는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 
            경고, 일시정지, 영구이용정지 등의 단계로 회원의 서비스 이용을 제한할 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제10조 (책임의 한계)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>서비스는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
            <li>서비스는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
            <li>서비스는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.</li>
            <li>서비스는 회원이 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제11조 (회원탈퇴 및 자격 상실)</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원은 서비스에 언제든지 탈퇴를 요청할 수 있으며, 서비스는 즉시 회원탈퇴를 처리합니다.</li>
            <li>회원이 다음 각 호의 사유에 해당하는 경우, 서비스는 회원자격을 제한 및 정지시킬 수 있습니다:
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">제12조 (기타)</h2>
          <p>
            본 약관에 명시되지 않은 사항에 대해서는 관계법령 및 서비스의 개별 이용정책에 따릅니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">부칙</h2>
          <p>본 약관은 2024년 1월 1일부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  );
}