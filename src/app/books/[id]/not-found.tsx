import Link from 'next/link'
import { Book, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function BookNotFound() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <Card className="p-8 text-center">
        <Book className="h-24 w-24 mx-auto mb-6 text-gray-400" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          도서를 찾을 수 없습니다
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          요청하신 도서 정보를 찾을 수 없습니다.<br />
          도서가 삭제되었거나 잘못된 링크일 수 있습니다.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              도서 검색하기
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p>
            문제가 지속된다면{' '}
            <a 
              href="mailto:support@readzone.com" 
              className="text-primary-600 hover:text-primary-700 underline"
            >
              고객지원
            </a>
            으로 문의해 주세요.
          </p>
        </div>
      </Card>
    </div>
  )
}