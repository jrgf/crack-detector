import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClassificationResult } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';

type Screen = 'home' | 'camera' | 'result' | 'history';
type ResultBackTarget = 'home' | 'history';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [lastResult, setLastResult] = useState<ClassificationResult | null>(null);
  const [shouldSaveResult, setShouldSaveResult] = useState(true);
  const [resultBackTarget, setResultBackTarget] = useState<ResultBackTarget>('home');

  function handleResult(result: ClassificationResult) {
    setLastResult(result);
    setShouldSaveResult(true);
    setResultBackTarget('home');
    setScreen('result');
  }

  function handleHistoryResult(result: ClassificationResult) {
    setLastResult(result);
    setShouldSaveResult(false);
    setResultBackTarget('history');
    setScreen('result');
  }

  function handleNewAnalysis() {
    setLastResult(null);
    setShouldSaveResult(true);
    setScreen('home');
  }

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onOpenCamera={() => setScreen('camera')}
          onOpenHistory={() => setScreen('history')}
          onResult={handleResult}
        />
      )}
      {screen === 'camera' && (
        <CameraScreen
          onCancel={() => setScreen('home')}
          onResult={handleResult}
        />
      )}
      {screen === 'result' && lastResult && (
        <ResultScreen
          result={lastResult}
          shouldAutoSave={shouldSaveResult}
          onResultChange={setLastResult}
          onBack={() => setScreen(resultBackTarget)}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          onBack={() => setScreen('home')}
          onSelect={handleHistoryResult}
        />
      )}
    </>
  );
}
