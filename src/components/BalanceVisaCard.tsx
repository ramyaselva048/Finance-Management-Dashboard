import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { AccountInfo } from '../types/finance';

interface BalanceVisaCardProps {
  balance: number;
  accountInfo: AccountInfo;
  waveData: { idx: number; val: number }[];
  onEditAccount: () => void;
}

export const BalanceVisaCard: React.FC<BalanceVisaCardProps> = ({
  balance,
  accountInfo,
  waveData,
  onEditAccount,
}) => {
  const [revealNumber, setRevealNumber] = useState(false);

  const absBalance = Math.abs(balance);
  const wholePart = Math.floor(absBalance).toLocaleString('en-US');
  const centsPart = (absBalance % 1).toFixed(2).substring(1); // ".00"

  return (
    <div
      onClick={onEditAccount}
      className="bg-white border border-[#dce1ec] rounded-[2px] p-[24px] relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-[#b8c2d8] transition-colors min-h-[296px]"
    >
      {/* Background Financial Wave Chart across the middle-to-right of the card */}
      <div className="absolute inset-x-0 top-[52px] h-[125px] pointer-events-none z-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={waveData}
            margin={{ top: 6, right: 0, left: 0, bottom: 0 }}
          >
            <Area
              type="linear"
              dataKey="val"
              stroke="#d3dae7"
              strokeWidth={1.6}
              fill="#f6f8fc"
              fillOpacity={0.65}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Row: YOUR BALANCE + VISA Logo Badge */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#7987a1]">
            YOUR BALANCE
          </div>
          <div className="mt-[4px] flex items-baseline tabular-nums leading-none">
            <span className="text-[31px] font-normal text-[#97a3b9] mr-[2px]">
              {balance < 0 ? '-$' : '$'}
            </span>
            <span className="font-display text-[34px] font-bold text-[#1c273c] tracking-[-0.02em]">
              {wholePart}
            </span>
            <span className="font-display text-[25px] font-normal text-[#1c273c]">
              {centsPart}
            </span>
          </div>
        </div>

        {/* Blue VISA Badge matching exact reference style */}
        <div className="w-[54px] h-[34px] bg-[#3366ff] rounded-[4px] flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
          <span className="font-display italic font-bold text-[15.5px] tracking-[0.02em] text-white leading-none select-none">
            VISA
          </span>
        </div>
      </div>

      {/* Middle Section: YOUR ACCOUNT NUMBER + Masked Dots + 5637 */}
      <div className="relative z-10 my-auto pt-[26px]">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#7987a1]">
          YOUR ACCOUNT NUMBER
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            setRevealNumber(!revealNumber);
          }}
          title="Click to toggle account number visibility"
          className="mt-[12px] flex items-center gap-[32px] sm:gap-[42px] select-none"
        >
          {revealNumber ? (
            <div className="font-display text-[20px] font-bold tracking-[0.14em] text-[#1c273c] tabular-nums">
              4532 &nbsp; 8910 &nbsp; 3412 &nbsp; {accountInfo.lastFour}
            </div>
          ) : (
            <>
              {/* Group 1 of 4 dark dots */}
              <div className="flex items-center gap-[5.5px]">
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
              </div>
              {/* Group 2 of 4 dark dots */}
              <div className="flex items-center gap-[5.5px]">
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
              </div>
              {/* Group 3 of 4 dark dots */}
              <div className="flex items-center gap-[5.5px]">
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
                <span className="w-[7.5px] h-[7.5px] rounded-full bg-[#1c273c]" />
              </div>
              {/* Last 4 digits */}
              <span className="font-display text-[20px] font-bold text-[#1c273c] tracking-[0.01em] tabular-nums leading-none">
                {accountInfo.lastFour}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: ACCOUNT HOLDER + ACCOUNT TYPE */}
      <div className="relative z-10 flex items-center gap-[60px] sm:gap-[84px] pt-[20px]">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7987a1]">
            ACCOUNT HOLDER
          </div>
          <div className="text-[14px] font-normal text-[#1c273c] mt-[5px]">
            {accountInfo.holderName}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7987a1]">
            ACCOUNT TYPE
          </div>
          <div className="text-[14px] font-normal text-[#1c273c] mt-[5px]">
            {accountInfo.accountType}
          </div>
        </div>
      </div>
    </div>
  );
};
