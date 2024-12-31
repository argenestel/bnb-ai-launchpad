// App.tsx
import { TokenPlatform } from "./TokenPlatform";
import { EVMProvider } from "./config/wagmi";
function App() {
  return (
    <div className="min-h-screen dark bg-background">
      <main>
        <EVMProvider>
          <TokenPlatform />
        </EVMProvider>
      </main>
    </div>
  );
}

export default App;
