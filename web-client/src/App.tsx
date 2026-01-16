import { LotteryProvider } from './context/LotteryContext';
import { MainPage } from './components';

function App() {
  return (
    <LotteryProvider>
      <div className="app">
        <MainPage />
      </div>
    </LotteryProvider>
  );
}

export default App;
