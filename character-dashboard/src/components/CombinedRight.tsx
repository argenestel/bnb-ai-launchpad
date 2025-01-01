import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SwapWidget from "./SwapWidget";
import CharacterFlow from "./CharacterFlow";
import { PTOKEN_ABI } from "./createui/ptokenabi";
import { abi } from "./createui/abi";

const CombinedRightPanel = ({ character }) => {
  const TOKEN_FACTORY_ADDRESS = "0xB5E00954B00cDd9511EA38d15F6bEC4bB0d83972";
  const PTOKEN_ADDRESS = "0xA3E2ea7628B215Ea2dB60a146027642579632643";

  return (
    <div className="relative h-full">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 bg-cover bg-center rounded-lg overflow-hidden"
        style={{
          backgroundImage: character?.backgroundImage 
            ? `url(${character.backgroundImage})` 
            : 'url(/api/placeholder/400/600)'
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Main Content */}
      <Card className="relative bg-background/50 backdrop-blur-sm h-full border-0">
        <CardContent className="p-4 h-full">
          <Tabs defaultValue="swap" className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/70 backdrop-blur-sm">
              <TabsTrigger value="swap" className="data-[state=active]:bg-primary/20">
                Swap
              </TabsTrigger>
              <TabsTrigger value="flow" className="data-[state=active]:bg-primary/20">
                Character View
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="swap" 
              className="h-[calc(100%-48px)] mt-4 rounded-lg bg-background/40 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center h-full">
                <SwapWidget
                  tokenFactoryAddress={TOKEN_FACTORY_ADDRESS}
                  tokenFactoryABI={abi}
                  pTokenAddress={PTOKEN_ADDRESS}
                  pTokenABI={PTOKEN_ABI}
                />
              </div>
            </TabsContent>

            <TabsContent 
              value="flow" 
              className="h-[calc(100%-48px)] mt-4 relative z-10"
            >
              {character && (
                <div className="h-full overflow-hidden rounded-lg">
                  <CharacterFlow character={character} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CombinedRightPanel;
