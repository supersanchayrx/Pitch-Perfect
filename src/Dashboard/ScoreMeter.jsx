import React from 'react';

export default function ScoreMeter({ score }) {
    const displayScore = score !== null ? score : '--';
    // Circle math: circumference = 2 * PI * r = 2 * PI * 70 ≈ 440
    const circumference = 440;
    const offset = score !== null ? circumference - (circumference * score) / 100 : circumference;

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle
                    className="text-surface-container-high"
                    cx="80" cy="80" fill="transparent" r="70"
                    stroke="currentColor" strokeWidth="8"
                />
                <circle
                    className="text-secondary neon-glow-secondary transition-all duration-1000"
                    cx="80" cy="80" fill="transparent" r="70"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeWidth="8"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-headline font-black text-on-surface">
                    {displayScore}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                    {score !== null ? 'PERCENT' : 'WAITING'}
                </span>
            </div>
        </div>
    );
}
