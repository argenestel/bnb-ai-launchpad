//@ts-nocheck
import { useState, useEffect } from "react";

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
				if (data.results?.length > 0) {
					const randomIndex = Math.floor(Math.random() * data.results.length);
					setBackgroundUrl(data.results[randomIndex].url);
				}
			} catch (error) {
				console.error("Error fetching neko image:", error);
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

const BackgroundMedia = ({ characterName, mode = "live", youtubeUrl }) => {
	const { backgroundUrl, loading } = useNekoBackground(characterName);

	return (
		<div className="absolute inset-0 -z-10 overflow-hidden">
			{mode === "live" && youtubeUrl ? (
				// YouTube background for live mode
				<div className="relative w-full h-full">
					<iframe
						src={youtubeUrl}
						className="absolute inset-0 w-full h-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
					<div className="absolute inset-0 bg-black/50" />
				</div>
			) : (
				// Image background for regular mode
				<div
					className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
					style={{
						backgroundImage: `url(${backgroundUrl || "/api/placeholder/1920/1080"})`,
						opacity: loading ? 0 : 0.85,
					}}
				/>
			)}

			{/* Common gradient overlays */}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
		</div>
	);
};

export default BackgroundMedia;
