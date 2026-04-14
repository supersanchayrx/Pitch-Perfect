export default function AudioInput({ onFileSelect, onLoadAudio, isSinging }) {
    return (
        <div className="flex items-center gap-3">
            <label className={`bg-gradient-to-r from-primary to-primary-dim text-on-primary font-headline font-bold px-5 py-2 rounded-lg transition-all duration-200 text-sm ${isSinging ? 'opacity-40 cursor-not-allowed' : 'hover:scale-95 cursor-pointer'}`}>
                Upload Audio
                <input
                    type="file"
                    accept=".wav,audio/*"
                    className="hidden"
                    disabled={isSinging}
                    onChange={(e) => onFileSelect(e.target.files[0])}
                />
            </label>
            <button
                onClick={onLoadAudio}
                disabled={isSinging}
                className={`px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/20 text-on-surface-variant font-headline text-sm font-semibold transition-all ${isSinging ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-variant'}`}
            >
                Synthesize Pitch
            </button>
        </div>
    )
}