import ObservatoryDashboard from "./ObservatoryDashboard"
import TopBar from "./TopBar"
import useAudioEngine from "./hooks/useAudioEngine"

function App() {
  const engine = useAudioEngine();


  return (
    <main className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen">
      <TopBar
        onFileSelect={engine.setFile}
        onLoadAudio={engine.loadAudio}
        onSingAlong={engine.startSingAlong}
        onStopSing={engine.stopSingAlong}
        isSinging={engine.isSinging}
        isProcessing={engine.isProcessing}
      />
      <ObservatoryDashboard
        refPitchData={engine.refPitchData}
        userPitchData={engine.userPitchData}
        score={engine.score}
        onReset={engine.resetUserData}
      />
    </main>
  )
}

export default App
