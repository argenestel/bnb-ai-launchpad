import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
	midnightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient();

export const config = getDefaultConfig({
	appName: "BNB Launchpad",
	projectId: "YOUR_PROJECT_ID",
	chains: [bscTestnet],
	ssr: true, // If your dApp uses server side rendering (SSR)
});
//0xD80DC42a1c0AD05CCF2f95Ee7831B4225b356e7D
//TokenFactory v1
export const EVMProvider = ({ children }: { children: React.ReactNode }) => {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider theme={midnightTheme()}>
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};
