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
      margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
      curve="linearClosed"
      borderWidth={3}
      borderColor={{ from: 'color' }}
      gridLevels={5}
      gridShape="circular"
      gridLabelOffset={24}
      enableDots={true}
      dotSize={10}
      dotColor="#ffffff"
      dotBorderWidth={2}
      dotBorderColor={{ from: 'color' }}
      enableDotLabel={true}
      dotLabel="value"
      dotLabelYOffset={-12}
      colors={['#8b5cf6']}
      fillOpacity={0.25}
      blendMode="multiply"
      animate={true}
      motionConfig="gentle"
      isInteractive={true}
      theme={{
        axis: {
          ticks: {
            text: {
              fontSize: 12,
              fill: '#78716c', // stone-500
              fontFamily: 'var(--font-sans, sans-serif)',
            },
          },
        },
        grid: {
          line: {
            stroke: '#e7e5e4', // stone-200
            strokeWidth: 1,
            strokeDasharray: '4 4',
          },
        },
        dots: {
          text: {
            fontSize: 11,
            fill: '#78716c', // stone-500
            fontFamily: 'var(--font-sans, sans-serif)',
          },
        },
      }}
      sliceTooltip={({ index, data }) => (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl rounded-xl border border-stone-100 ring-1 ring-black/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <strong className="text-stone-900 font-semibold">{index}</strong>
          </div>
          <div className="text-sm text-stone-600 pl-4">
            <span className="font-medium text-stone-900">{data[0].value}</span>
            권<span className="text-stone-400 mx-1">•</span>
            <span className="text-stone-500">
              {Math.round(
                (data[0].value / data.reduce((sum, d) => sum + d.value, 0)) *
                  100
              )}
              %
            </span>
          </div>
        </div>
      )}
    />
  );
}
