import React from 'react';
import AsteroidsGame from './components/AsteroidsGame';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <AsteroidsGame />
    </div>
  );
};

export default App;
