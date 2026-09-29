import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ProfitMarginCardProps {
  title: string;
  descriptionLine1: string;
  descriptionLine2Prefix: string;
  percentage: number;
  activeColor: string;
  onLearnMore: () => void;
}

export const ProfitMarginCard: React.FC<ProfitMarginCardProps> = ({
  title,
  descriptionLine1,
  descriptionLine2Prefix,
  percentage,
  activeColor,
  onLearnMore,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const chartData = [
    { name: 'Value', value: clamped },
    { name: 'Remainder', value: Math.max(0, 100 - clamped) },
  ];

  return (
    <div
      onClick={onLearnMore}
      className="bg-white border border-[#dce1ec] rounded-[2px] p-[22px] flex flex-col justify-between cursor-pointer hover:border-[#b8c2d8] transition-colors group"
    >
      <div>
        <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.03em] text-[#1c273c] leading-tight">
          {title}
        </h3>
        <p className="text-[12px] leading-[1.45] text-[#7987a1] mt-[8px]">
          {descriptionLine1}
          <br />
          {descriptionLine2Prefix}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLearnMore();
            }}
            className="text-[#3366ff] hover:underline font-normal focus:outline-none"
          >
            Learn more
          </button>
        </p>
      </div>

      {/* Circular Donut Progress Chart (154px diameter, clockwise from 12 o'clock) */}
      <div className="relative w-[154px] h-[154px] mx-auto mt-[20px] mb-[4px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={63}
              outerRadius={76}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={activeColor} />
              <Cell fill="#e2e7f1" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Percentage Label */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ color: activeColor }}
        >
          <span className="font-display text-[30px] font-medium tracking-[-0.02em] tabular-nums">
            {clamped}%
          </span>
        </div>
      </div>
    </div>
  );
};
