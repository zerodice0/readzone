import { ResponsiveBar } from '@nivo/bar';

interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

interface GenreBarChartProps {
  data: GenreStats[];
}

/**
 * 최대 권수에 따라 적절한 정수 tick 값 배열 생성
 * 권수는 항상 정수이므로 소수점 tick을 방지
 */
function calculateIntegerTicks(maxCount: number): number[] {
  if (maxCount <= 0) {
    return [0, 1];
  } else if (maxCount <= 5) {
    // 5권 이하: 각 정수 표시 (0, 1, 2, 3, 4, 5)
    return Array.from({ length: maxCount + 1 }, (_, i) => i);
  } else if (maxCount <= 10) {
    // 10권 이하: 2 단위 (0, 2, 4, 6, 8, 10)
    const tickCount = Math.ceil(maxCount / 2) + 1;
    return Array.from({ length: tickCount }, (_, i) => i * 2);
  } else {
    // 10권 초과: 적절한 간격으로 5~6개 tick
    const step = Math.ceil(maxCount / 5);
    const tickCount = Math.ceil(maxCount / step) + 1;
    return Array.from({ length: tickCount }, (_, i) => i * step);
  }
}

export function GenreBarChart({ data }: GenreBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        데이터가 없습니다
      </div>
    );
  }

  // Nivo Bar 형식으로 변환 (내림차순 정렬 유지)
  const barData = data.map((item) => ({
    genre: item.genre,
    count: item.count,
    percentage: item.percentage,
  }));

  // 최대 권수 계산하여 정수 tick 생성
  const maxCount = Math.max(...data.map((item) => item.count));
  const tickValues = calculateIntegerTicks(maxCount);

  return (
    <ResponsiveBar
      data={barData}
      keys={['count']}
      indexBy="genre"
      margin={{ top: 10, right: 20, bottom: 50, left: 100 }}
      padding={0.3}
      layout="horizontal"
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      colors={{ scheme: 'set2' }}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: '권수',
        legendPosition: 'middle',
        legendOffset: 40,
        tickValues: tickValues,
        format: (v) => Math.floor(Number(v)).toString(),
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        truncateTickAt: 12,
      }}
      enableLabel={true}
      label={(d) => `${d.value}권`}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      animate={true}
      motionConfig="gentle"
      tooltip={({ indexValue, value, data }) => (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-stone-200">
          <strong className="text-stone-900">{indexValue}</strong>
          <div className="text-sm text-stone-600">
            {value}권 ({data.percentage}%)
          </div>
        </div>
      )}
    />
  );
}
