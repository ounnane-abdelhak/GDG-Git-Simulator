import GitSimulator from './components/GitSimulator';

function App() {
  return (
    // We set a dark background here to match the simulator's theme
    <div className="w-full min-h-screen bg-slate-900">
      <GitSimulator />
    </div>
  );
}

export default App;