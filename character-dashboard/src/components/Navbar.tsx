import React from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar = () => {
	return (
		<nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center">
				<div className="mr-8">
					<Link to="/" className="flex items-center space-x-2">
						<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
							Agents AI
						</h1>
					</Link>
				</div>

				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList>
						<NavigationMenuItem>
							<Link to="/" className={navigationMenuTriggerStyle()}>
								Dashboard
							</Link>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<Link to="/create" className={navigationMenuTriggerStyle()}>
								Create
							</Link>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>

				<div className="flex flex-1 items-center justify-end space-x-4">
					<ConnectButton />
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
