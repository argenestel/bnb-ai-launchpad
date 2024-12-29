import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
	darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient();

const config = getDefaultConfig({
	appName: "BNB Launchpad",
	projectId: "YOUR_PROJECT_ID",
	chains: [mainnet, polygon, optimism, arbitrum, base],
	ssr: true, // If your dApp uses server side rendering (SSR)
});

export const EVMProvider = ({ children }) => {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};
