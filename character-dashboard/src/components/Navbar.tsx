//@ts-nocheck
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

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
		</>
	);

	return (
		<nav className="sticky rounded-xl px-5 top-0 w-full z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center">
				{/* Logo */}
				<div className="mr-4 md:mr-8">
					<Link to="/" className="flex items-center space-x-2">
						<h1 className="text-lg md:text-xl font-bold">
							<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
								Agents AI
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

				{/* Connect Button */}
				<div className="flex flex-1 items-center justify-end">
					<ConnectButton
						className="scale-90 md:scale-100"
						accountStatus={{
							smallScreen: "avatar",
							largeScreen: "full",
						}}
					/>
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
