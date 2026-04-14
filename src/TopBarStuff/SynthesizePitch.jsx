export default function SynthesizePitch({ onSingAlong, onStopSing, isSinging }) {
  return (
    <div className="flex items-center gap-2">
      {!isSinging ? (
        <button
          onClick={onSingAlong}
          className="px-4 py-2 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary font-headline text-sm font-semibold hover:bg-secondary/30 transition-all"
        >
          Sing Along
        </button>
      ) : (
        <button
          onClick={onStopSing}
          className="px-4 py-2 rounded-lg bg-error/20 border border-error/30 text-error font-headline text-sm font-semibold hover:bg-error/30 transition-all"
        >
          Stop Sing Along
        </button>
      )}
    </div>
  )
}
