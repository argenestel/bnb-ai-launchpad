import  { useState } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, Twitter } from "lucide-react";

const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const NavLinks = () => (
		<>
			<NavigationMenuItem>
				<Link
					to="/"
					className={navigationMenuTriggerStyle() + " text-sm font-medium"}
					onClick={() => setIsMobileMenuOpen(false)}
				>
					Dashboard
				</Link>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<Link
					to="/create"
					className={navigationMenuTriggerStyle() + " text-sm font-medium"}
					onClick={() => setIsMobileMenuOpen(false)}
				>
					Create
				</Link>
			</NavigationMenuItem>
			<NavigationMenuItem>
				<a
					href="https://docs.agentarcade.xyz"
					target="_blank"
					rel="noopener noreferrer"
					className={navigationMenuTriggerStyle() + " text-sm font-medium"}
					onClick={() => setIsMobileMenuOpen(false)}
				>
					Docs
				</a>
			</NavigationMenuItem>
		</>
	);

	return (
		<nav className="sticky rounded-xl px-5 top-0 w-full z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center">
				{/* Logo */}
				<div className="mr-4 md:mr-8">
					<Link to="/" className="flex items-center space-x-2">
						<h1 className="text-lg md:text-xl font-bold">
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-gray-500 to-gray-200">
								Agent Arcade
							</span>
						</h1>
					</Link>
				</div>

				{/* Desktop Navigation */}
				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList>
						<NavLinks />
					</NavigationMenuList>
				</NavigationMenu>

				{/* Mobile Menu Button */}
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden mr-2"
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				>
					{isMobileMenuOpen ? (
						<X className="h-5 w-5" />
					) : (
						<Menu className="h-5 w-5" />
					)}
				</Button>

				{/* Social and Connect Button */}
				<div className="flex flex-1 items-center justify-end space-x-4">
					<a
						href="https://twitter.com/AgentArcade"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-primary transition-colors"
					>
						<Twitter className="h-5 w-5" />
					</a>
					<ConnectButton />
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			{isMobileMenuOpen && (
				<div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<NavigationMenu className="container py-4">
						<NavigationMenuList className="flex flex-col space-y-2">
							<NavLinks />
						</NavigationMenuList>
					</NavigationMenu>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
