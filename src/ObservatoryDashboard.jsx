import React from 'react'
import Chart from './Dashboard/Chart'
import ScoreMeter from './Dashboard/ScoreMeter'

export default function ObservatoryDashboard({ refPitchData, userPitchData, score, onReset }) {
  return (
    <div>
      <div className="flex-1 p-8 pt-24 min-h-screen text-on-surface">

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-extrabold font-headline tracking-tighter mb-2">
              Pitch <span className="text-primary neon-glow-primary">Observatory</span>
            </h1>
            <p className="text-on-surface-variant font-light max-w-xl">
              Uses YIN algorithm to detect pitch and compare it with the reference track.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-8 glass-panel rounded-2xl p-6 relative flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Pitch Comparison</span>
                <h2 className="text-2xl font-headline font-bold">Frequency Response (Hz)</h2>
              </div>
              <button
                onClick={onReset}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20 text-on-surface-variant font-headline text-xs font-semibold hover:bg-surface-variant hover:text-error transition-all"
              >
                Reset
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-outline-variant/20 rounded-xl">
              <Chart refPitchData={refPitchData} userPitchData={userPitchData} />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center relative h-full">
              <span className="text-[10px] font-bold text-secondary tracking-[0.2em] uppercase mb-4">Pitch Accuracy</span>

              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-outline-variant/20 rounded-xl w-full">
                <ScoreMeter score={score} />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
