import React from 'react';

interface FinancialRatiosCardProps {
  quickRatioDisplay: string;
  quickRatioProgress: number; // 0 to 100
  currentRatioDisplay: string;
  currentRatioProgress: number; // 0 to 100
  onInspectRatios: () => void;
}

export const FinancialRatiosCard: React.FC<FinancialRatiosCardProps> = ({
  quickRatioDisplay,
  quickRatioProgress,
  currentRatioDisplay,
  currentRatioProgress,
  onInspectRatios,
}) => {
  return (
    <div
      onClick={onInspectRatios}
      className="bg-white border border-[#dce1ec] rounded-[2px] p-[24px] flex flex-col justify-between gap-[28px] cursor-pointer hover:border-[#b8c2d8] transition-colors h-full"
    >
      {/* Top Half: QUICK RATIO */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-[24px]">
        {/* Left Custom Gray Line-Chart Vector Icon (exact match to reference) */}
        <div className="w-[148px] h-[126px] flex items-center justify-center shrink-0">
          <svg
            width="124"
            height="108"
            viewBox="0 0 124 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Thick rounded double-line zigzag wave going up-down-up */}
            <path
              d="M23 64L50 31C53.5 26.8 60 27.2 63 31.8L74 48.5C76.2 51.8 81 51.8 83.2 48.5L103 21"
              stroke="#cfd6e4"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M29 74L53 45C55.5 42 60 42.3 62.2 45.6L73.5 62.5C76.5 67 83 67 86 62.5L109 30"
              stroke="#cfd6e4"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom Horizontal Base Line + Short Center Tick */}
            <line
              x1="16"
              y1="91"
              x2="108"
              y2="91"
              stroke="#cfd6e4"
              strokeWidth="9.5"
              strokeLinecap="round"
            />
            <line
              x1="16"
              y1="103"
              x2="45"
              y2="103"
              stroke="#cfd6e4"
              strokeWidth="6.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Right Content for QUICK RATIO */}
        <div className="flex-1 w-full">
          <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.03em] text-[#1c273c]">
            QUICK RATIO
          </h3>
          <div className="font-display text-[25px] font-bold text-[#1c273c] mt-[4px] leading-tight tabular-nums">
            {quickRatioDisplay}
          </div>

          {/* Yellow/Amber Progress Bar */}
          <div className="w-full h-[5px] bg-[#e2e7f1] mt-[8px] overflow-hidden">
            <div
              className="h-full bg-[#f6b900] transition-all duration-200"
              style={{ width: `${Math.max(8, Math.min(100, quickRatioProgress))}%` }}
            />
          </div>

          <div className="text-[11.5px] text-[#8592a6] mt-[7px]">
            Quick Ratio Goal: 1.0 or higher
          </div>

          <p className="text-[12.5px] leading-[1.45] text-[#3b4863] mt-[9px]">
            Measures your Current Assets + Accounts
            <br />
            Receivable / Current Liabilities{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspectRatios();
              }}
              className="text-[#3366ff] hover:underline font-normal focus:outline-none"
            >
              Learn more
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Half: CURRENT RATIO */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-[24px]">
        {/* Left Custom Gray Mountain Area-Chart Vector Icon (exact match to reference) */}
        <div className="w-[148px] h-[126px] flex items-center justify-center shrink-0">
          <svg
            width="124"
            height="108"
            viewBox="0 0 124 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft inner fill at bottom of mountain chart */}
            <path
              d="M20 55L47 30L72 52L99 23V94H20V55Z"
              fill="#e6ebf4"
            />
            {/* Thick rounded mountain outline */}
            <path
              d="M20 55L44.5 31.5C46.5 29.6 49.6 29.6 51.6 31.5L70.5 49.5C72.5 51.4 75.6 51.3 77.5 49.3L97 29C99.5 26.4 104 28.2 104 31.8V92C104 94.8 101.8 97 99 97H25C22.2 97 20 94.8 20 92V55Z"
              stroke="#cfd6e4"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Right Content for CURRENT RATIO */}
        <div className="flex-1 w-full">
          <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.03em] text-[#1c273c]">
            CURRENT RATIO
          </h3>
          <div className="font-display text-[25px] font-bold text-[#1c273c] mt-[4px] leading-tight tabular-nums">
            {currentRatioDisplay}
          </div>

          {/* Vibrant Green Progress Bar */}
          <div className="w-full h-[5px] bg-[#e2e7f1] mt-[8px] overflow-hidden">
            <div
              className="h-full bg-[#3bb001] transition-all duration-200"
              style={{ width: `${Math.max(8, Math.min(100, currentRatioProgress))}%` }}
            />
          </div>

          <div className="text-[11.5px] text-[#8592a6] mt-[7px]">
            Quick Ratio Goal: 2.0 or higher
          </div>

          <p className="text-[12.5px] leading-[1.45] text-[#3b4863] mt-[9px]">
            Measures your Current Assets / Current
            <br />
            Liabilities.{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspectRatios();
              }}
              className="text-[#3366ff] hover:underline font-normal focus:outline-none"
            >
              Learn more
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
