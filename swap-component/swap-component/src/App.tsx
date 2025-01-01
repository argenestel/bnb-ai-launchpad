// App.tsx
import { TokenPlatform } from "./TokenPlatform";
import { EVMProvider } from "./config/wagmi";
import SwapWidget from "./SwapWidget";
import { PTOKEN_ABI } from "./ptokenabi";
import { TOKEN_FACTORY_ABI } from "./abi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
function App() {
  const TOKEN_FACTORY_ADDRESS = "0x811460efdcB4d335443a306568AEF6ed4DeA65Dd";

  const PTOKEN_ADDRESS = "0x206De6ac6b1EBa897788cC0FE89A47365c214504";
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
