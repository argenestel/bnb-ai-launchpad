import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CharacterDashboard from "@/components/CharacterDashboard";
import CreateCharacterPage from "@/components/CreateCharacterPage";
import ChatInterface from "@/components/ChatInterface";
import { ThemeProvider } from "@/components/theme-provider";
import { EVMProvider } from "@/components/evm-provider";
function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<EVMProvider>
				<div className="min-h-screen">
					<Router>
						<Routes>
							<Route path="/" element={<CharacterDashboard />} />
							<Route path="/create" element={<CreateCharacterPage />} />
							<Route path="/chat/:characterName" element={<ChatInterface />} />
						</Routes>
					</Router>
				</div>
			</EVMProvider>
		</ThemeProvider>
	);
}

export default App;
