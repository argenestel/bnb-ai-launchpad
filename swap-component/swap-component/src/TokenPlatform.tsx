// src/components/TokenPlatform.tsx
import { SwapWidget } from "./SwapWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";

export function TokenPlatform() {
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="swap" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="swap" className="flex items-center gap-2">
            Swap Tokens
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Create Token
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="mt-6">
          <SwapWidget />
        </TabsContent>

        <TabsContent value="create" className="mt-6 space-y-6"></TabsContent>
      </Tabs>
    </div>
  );
}
