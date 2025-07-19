import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { readingGoalService, type ReadingGoal } from '../services/readingGoalService';
import Button from '../components/ui/Button';
import ReadingGoalCard from '../components/reading-goals/ReadingGoalCard';
import ReadingGoalForm from '../components/reading-goals/ReadingGoalForm';

const ReadingGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [currentYearGoal, setCurrentYearGoal] = useState<ReadingGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formLoading, setFormLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadReadingGoals();
    loadCurrentYearGoal();
  }, []);

  const loadReadingGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await readingGoalService.getReadingGoals({ page: 1, limit: 10 });
      setGoals(response.items);
    } catch (err) {
      console.error('독서 목표 로드 실패:', err);
      setError('독서 목표를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentYearGoal = async () => {
    try {
      const goal = await readingGoalService.getReadingGoal(currentYear);
      setCurrentYearGoal(goal);
    } catch (err) {
      console.error('현재 연도 독서 목표 로드 실패:', err);
      // 현재 연도 목표가 없는 경우는 정상적인 상황
      setCurrentYearGoal(null);
    }
  };

  const handleCreateGoal = async (booksTarget: number, pagesTarget: number) => {
    try {
      setFormLoading(true);
      const newGoal = await readingGoalService.setReadingGoal(formYear, {
        booksTarget,
        pagesTarget
      });

      // 목표 목록 업데이트
      setGoals(prev => {
        const filtered = prev.filter(goal => goal.year !== formYear);
        return [newGoal, ...filtered].sort((a, b) => b.year - a.year);
      });

      // 현재 연도 목표인 경우 별도 상태 업데이트
      if (formYear === currentYear) {
        setCurrentYearGoal(newGoal);
      }

      setShowForm(false);
      setFormYear(currentYear);
    } catch (err) {
      console.error('독서 목표 설정 실패:', err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGoal = async (year: number) => {
    if (!confirm(`${year}년 독서 목표를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await readingGoalService.deleteReadingGoal(year);
      setGoals(prev => prev.filter(goal => goal.year !== year));
      
      if (year === currentYear) {
        setCurrentYearGoal(null);
      }
    } catch (err) {
      console.error('독서 목표 삭제 실패:', err);
      alert('독서 목표 삭제 중 오류가 발생했습니다.');
    }
  };

  const openFormForYear = (year: number) => {
    setFormYear(year);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">독서 목표를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadReadingGoals} variant="outline">
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="w-8 h-8 mr-3 text-blue-600" />
              독서 목표
            </h1>
            <p className="text-gray-600 mt-2">
              연간 독서 목표를 설정하고 진행률을 확인해보세요
            </p>
          </div>
          <Button
            onClick={() => openFormForYear(currentYear)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 목표 설정
          </Button>
        </div>

        {/* 목표 설정 폼 */}
        {showForm && (
          <div className="mb-8">
            <ReadingGoalForm
              year={formYear}
              initialBooksTarget={currentYearGoal?.booksTarget || 12}
              initialPagesTarget={currentYearGoal?.pagesTarget || 3000}
              onSubmit={handleCreateGoal}
              onCancel={() => setShowForm(false)}
              loading={formLoading}
            />
          </div>
        )}

        {/* 현재 연도 목표 하이라이트 */}
        {currentYearGoal && !showForm && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              {currentYear}년 현재 진행률
            </h2>
            <ReadingGoalCard goal={currentYearGoal} />
          </div>
        )}

        {/* 목표가 없는 경우 안내 */}
        {!currentYearGoal && goals.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              독서 목표가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 독서 목표를 설정해보세요!
            </p>
            <Button onClick={() => openFormForYear(currentYear)}>
              <Plus className="w-4 h-4 mr-2" />
              {currentYear}년 목표 설정
            </Button>
          </div>
        )}

        {/* 전체 목표 목록 */}
        {goals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              모든 독서 목표
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div key={goal.id} className="relative">
                  <ReadingGoalCard goal={goal} />
                  <div className="absolute top-2 right-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openFormForYear(goal.year)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.year)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingGoalsPage;