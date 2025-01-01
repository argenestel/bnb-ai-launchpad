import React, { useEffect, useState } from 'react';

interface GameBackgroundProps {
  characterName?: string;
  imageUrl?: string;
}

const GameBackground = ({ characterName, imageUrl }: GameBackgroundProps) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        if (imageUrl) {
          setBackgroundUrl(imageUrl);
          return;
        }

        const response = await fetch(
          `https://nekos.best/api/v2/search?query=${encodeURIComponent(characterName || '')}&type=1`,
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.results.length);
          setBackgroundUrl(data.results[randomIndex].url);
        }
      } catch (error) {
        console.error("Error fetching background:", error);
      }
    };

    fetchBackground();
  }, [characterName, imageUrl]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      {backgroundUrl && (
        <>
          <img
            src={backgroundUrl}
            alt="background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </>
      )}
    </div>
  );
};

export default GameBackground; 