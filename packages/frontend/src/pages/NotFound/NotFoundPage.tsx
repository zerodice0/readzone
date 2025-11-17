import { useNavigate } from 'react-router-dom';
import { Home, BookOpen, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Large decorative 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] sm:text-[220px] font-bold leading-none text-primary-100 select-none">
            404
          </div>
          {/* Floating book icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl animate-bounce">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-lg text-stone-600 max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
            <br />
            독서의 즐거움을 찾아 다른 곳을 둘러보세요.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate('/feed')}
            className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 group w-full sm:w-auto"
          >
            <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            피드로 돌아가기
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/books')}
            className="border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 group w-full sm:w-auto"
          >
            <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            책 둘러보기
          </Button>
        </div>

        {/* Decorative element */}
        <div className="mt-16 flex justify-center gap-2 opacity-40">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-400"
              style={{
                animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
