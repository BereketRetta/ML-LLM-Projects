// packages/web/src/components/MessageList.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { UserInput, AgentResponse } from '@toolcraft/shared';
import UserMessage from './UserMessage';
import AgentMessage from './AgentMessage';

interface MessageListProps {
  messages: (UserInput | AgentResponse)[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 4,
        textAlign: 'center'
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            No messages yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start a conversation with the Toolcraft AI Assistant.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {messages.map((message) => {
        // Check if the message is a UserInput
        if ('type' in message && (message.type === 'text' || message.type === 'image' || message.type === 'file')) {
          return (
            <UserMessage 
              key={message.id} 
              message={message as UserInput} 
            />
          );
        } 
        // Otherwise it's an AgentResponse
        else {
          return (
            <AgentMessage 
              key={message.id} 
              message={message as AgentResponse} 
            />
          );
        }
      })}
    </Box>
  );
};

export default MessageList;