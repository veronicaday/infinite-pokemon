import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import MainMenu from './pages/MainMenu';
import CreationScreen from './pages/CreationScreen';
import BattleScreen from './pages/BattleScreen';
import PokedexScreen from './pages/PokedexScreen';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const loadConfig = useGameStore((s) => s.loadConfig);

  useEffect(() => {
    loadConfig().catch(console.error);
  }, [loadConfig]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {currentScreen === 'menu' && <MainMenu />}
      {currentScreen === 'creation' && <CreationScreen />}
      {currentScreen === 'battle' && <BattleScreen />}
      {currentScreen === 'pokedex' && <PokedexScreen />}
    </div>
  );
}
