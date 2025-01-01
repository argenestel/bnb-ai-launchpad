import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Message = ({ message, index, totalMessages, character, backgroundUrl }) => {
  // Calculate fade-in opacity based on message position
  const opacity = Math.max(0, Math.min(1, (index + 1) / (totalMessages * 0.6)));
  
  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric"
    }).format(new Date(timestamp));
  };

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } transition-opacity duration-300`}
      style={{ opacity }}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 space-y-2 backdrop-blur-sm
          ${
            message.role === "user"
              ? "bg-primary/80 text-primary-foreground"
              : "bg-muted/80"
          }`}
      >
        <div className="flex items-center gap-2">
          {message.role === "assistant" && character && (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={backgroundUrl}
                alt={character.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-background/90 text-foreground">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0 leading-relaxed">
            {message.content}
          </div>
        </div>
        
        <div className={`flex items-center justify-between text-xs
          ${
            message.role === "user"
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          }`}
        >
          <span>{formatTimestamp(message.metadata?.timestamp)}</span>
          {message.metadata?.topics && (
            <div className="flex gap-1">
              {message.metadata.topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded-full bg-background/30"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
