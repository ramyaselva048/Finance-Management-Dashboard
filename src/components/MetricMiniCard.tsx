import React from 'react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

interface MetricMiniCardProps {
  title: string;
  amount: number;
  barColor: string;
  sparklineValues: number[];
  changePercent: string;
  changePositiveColor: boolean; // true = green (#3bb001), false = red (#dc3545)
  comparisonText?: string;
  onClickCard: () => void;
}

export const MetricMiniCard: React.FC<MetricMiniCardProps> = ({
  title,
  amount,
  barColor,
  sparklineValues,
  changePercent,
  changePositiveColor,
  comparisonText = 'higher vs previous month',
  onClickCard,
}) => {
  const absAmount = Math.abs(amount);
  const wholePart = Math.floor(absAmount).toLocaleString('en-US');
  const centsPart = (absAmount % 1).toFixed(2).substring(1); // e.g. ".50" or ".00"

  const chartData = sparklineValues.map((v, i) => ({ idx: i, val: v }));

  return (
    <div
      onClick={onClickCard}
      className="bg-white border border-[#dce1ec] rounded-[2px] p-[22px] flex flex-col justify-between cursor-pointer hover:border-[#b8c2d8] transition-colors min-h-[168px]"
    >
      {/* Card Title */}
      <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.03em] text-[#1c273c]">
        {title}
      </h3>

      {/* Mini Bar Sparkline Chart + Baseline */}
      <div className="my-[12px]">
        <div className="w-[82px] h-[27px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={1.5}>
              <Bar
                dataKey="val"
                fill={barColor}
                radius={[0.5, 0.5, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Subtle horizontal baseline under the bars matching reference */}
        <div
          className="w-[82px] h-[1.5px] mt-[1px] opacity-60"
          style={{ backgroundColor: barColor }}
        />
      </div>

      {/* Dollar Value + Month-over-Month Change */}
      <div>
        <div className="flex items-baseline tabular-nums leading-none">
          <span className="text-[22px] font-normal text-[#97a3b9] mr-[5px]">$</span>
          <span className="font-display text-[25px] font-bold text-[#1c273c] tracking-[-0.02em]">
            {wholePart}
          </span>
          <span className="font-display text-[18px] font-normal text-[#1c273c]">
            {centsPart}
          </span>
        </div>

        <div className="text-[11.5px] mt-[6px] leading-tight">
          <span
            className="font-bold tabular-nums"
            style={{ color: changePositiveColor ? '#3bb001' : '#dc3545' }}
          >
            {changePercent}
          </span>{' '}
          <span className="text-[#3b4863]">{comparisonText}</span>
        </div>
      </div>
    </div>
  );
};
