import { ResponsiveRadar } from '@nivo/radar';

interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

interface GenreRadarChartProps {
  data: GenreStats[];
}

export function GenreRadarChart({ data }: GenreRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        데이터가 없습니다
      </div>
    );
  }

  // Nivo Radar 형식으로 변환
  // 레이더 차트는 하나의 데이터 포인트에 여러 키가 있는 형태
  const radarData = data.map((item) => ({
    genre: item.genre,
    독서량: item.count,
  }));

  return (
    <ResponsiveRadar
      data={radarData}
      keys={['독서량']}
      indexBy="genre"
      maxValue="auto"
      margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
      curve="linearClosed"
      borderWidth={2}
      borderColor={{ from: 'color', modifiers: [] }}
      gridLevels={5}
      gridShape="circular"
      gridLabelOffset={16}
      enableDots={true}
      dotSize={8}
      dotColor={{ theme: 'background' }}
      dotBorderWidth={2}
      dotBorderColor={{ from: 'color', modifiers: [] }}
      colors={{ scheme: 'set2' }}
      fillOpacity={0.25}
      blendMode="multiply"
      animate={true}
      motionConfig="gentle"
      isInteractive={true}
      sliceTooltip={({ index, data }) => (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-stone-200">
          <strong className="text-stone-900">{index}</strong>
          <div className="text-sm text-stone-600">
            {data[0].value}권 (
            {Math.round(
              (data[0].value / data.reduce((sum, d) => sum + d.value, 0)) * 100
            )}
            %)
          </div>
        </div>
      )}
    />
  );
}
