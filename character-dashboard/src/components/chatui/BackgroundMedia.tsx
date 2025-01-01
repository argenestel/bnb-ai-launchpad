import React, { useState, useEffect } from "react";

export const useNekoBackground = (characterName) => {
	const [backgroundUrl, setBackgroundUrl] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchNekoImage = async () => {
			try {
				const response = await fetch(
					`https://nekos.best/api/v2/search?query=${encodeURIComponent(characterName)}&type=1`,
				);
				const data = await response.json();
				if (data.results && data.results.length > 0) {
					const randomIndex = Math.floor(Math.random() * data.results.length);
					setBackgroundUrl(data.results[randomIndex].url);
				}
			} catch (error) {
				console.error("Error fetching neko background:", error);
			} finally {
				setLoading(false);
			}
		};

		if (characterName) {
			fetchNekoImage();
		}
	}, [characterName]);

	return { backgroundUrl, loading };
};

const BackgroundMedia = ({ characterName }) => {
	const { backgroundUrl, loading } = useNekoBackground(characterName);

	return (
		<div className="absolute inset-0 -z-10">
			{/* Main background image */}
			<div
				className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
				style={{
					backgroundImage: `url(${backgroundUrl || "/api/placeholder/1920/1080"})`,
					opacity: loading ? 0 : 0.85,
				}}
			/>

			{/* Gradient overlays */}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
		</div>
	);
};

export default BackgroundMedia;
