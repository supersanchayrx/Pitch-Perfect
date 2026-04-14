import React from 'react'
import AudioInput from './TopBarStuff/AudioInput'
import SynthesizePitch from './TopBarStuff/SynthesizePitch'

export default function TopBar({ onFileSelect, onLoadAudio, onSingAlong, onStopSing, isSinging, isProcessing }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0e10]/80 backdrop-blur-xl h-16 flex items-center px-8 border-b border-outline-variant/10">
            <div className="flex justify-between items-center w-full max-w-[1920px] mx-auto">
                <div className="flex items-center gap-8">
                    <span className="text-2xl font-bold tracking-tighter text-[#69daff] drop-shadow-[0_0_8px_rgba(105,218,255,0.5)] font-headline">
                        PitchPerfect
                    </span>
                    <nav className="hidden md:flex items-center gap-6 font-headline tracking-tight">
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <AudioInput onFileSelect={onFileSelect} onLoadAudio={onLoadAudio} isSinging={isSinging} />
                    <SynthesizePitch onSingAlong={onSingAlong} onStopSing={onStopSing} isSinging={isSinging} />

                    {/* User Profile Icons */}
                    <div className="flex gap-2">
                        <a 
                            href="https://github.com/supersanchayrx/Pitch-Perfect/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-on-surface-variant bg-surface-container-high border border-outline-variant/20 hover:bg-surface-variant hover:text-primary rounded-lg transition-all font-headline text-sm font-semibold flex items-center gap-2"
                        >
                            ⭐ Star this repo on GitHub
                        </a>
                    </div>
                </div>


            </div>
        </header>
    )
}
