import React from "react";
import { Card } from "@/components/ui/card";
import ChatInterface from "./ChatInterface";
import CharacterFlowVisualization from "./CharacterFlowVisualization";

const SplitInterface = ({
  messages,
  input,
  onInputChange,
  onSendMessage,
  loading,
  characterData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="w-full">
        <ChatInterface
          messages={messages}
          input={input}
          onInputChange={onInputChange}
          onSendMessage={onSendMessage}
          loading={loading}
          characterData={characterData}
        />
      </div>
      <div className="w-full">
        <Card className="h-[calc(100vh-25rem)]">
          <CharacterFlowVisualization characterData={characterData} />
        </Card>
      </div>
    </div>
  );
};

export default SplitInterface;
