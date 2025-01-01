// App.tsx
import { TokenPlatform } from "./TokenPlatform";
import { EVMProvider } from "./config/wagmi";
import SwapWidget from "./SwapWidget";
import { PTOKEN_ABI } from "./ptokenabi";
import { TOKEN_FACTORY_ABI } from "./abi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
function App() {
  const TOKEN_FACTORY_ADDRESS = "0xa279eB501E56981aAF11bEA95A281A3FA9227bd6";

  const PTOKEN_ADDRESS = "0xA3E2ea7628B215Ea2dB60a146027642579632643";
  return (
    <div className="min-h-screen dark bg-background">
      <main>
        <EVMProvider>
          <ConnectButton />
          <SwapWidget
            tokenFactoryAddress={TOKEN_FACTORY_ADDRESS}
            tokenFactoryABI={TOKEN_FACTORY_ABI}
            pTokenAddress={PTOKEN_ADDRESS}
            pTokenABI={PTOKEN_ABI}
          />
        </EVMProvider>
      </main>
    </div>
  );
}

export default App;
