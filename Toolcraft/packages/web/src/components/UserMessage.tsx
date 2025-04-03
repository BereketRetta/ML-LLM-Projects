// packages/web/src/components/UserMessage.tsx
import React from 'react';
import { Box, Paper, Typography, Card, CardMedia } from '@mui/material';
import { UserInput } from '@toolcraft/shared';
import { InsertDriveFile as FileIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface UserMessageProps {
  message: UserInput;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'flex-end',
      mb: 2
    }}>
      <Box sx={{ maxWidth: '80%' }}>
        {message.type === 'image' && message.imageUrl && (
          <Card sx={{ mb: 1, maxWidth: 400, borderRadius: 2 }}>
            <CardMedia
              component="img"
              image={message.imageUrl}
              alt="User uploaded image"
              sx={{ maxHeight: 300, objectFit: 'contain' }}
            />
          </Card>
        )}
        
        {message.type === 'file' && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1, 
            mb: 1,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider'
          }}>
            <FileIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              {message.fileName || 'File'}
            </Typography>
          </Box>
        )}
        
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '18px 18px 4px 18px',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </Paper>
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="right" 
          sx={{ display: 'block', mt: 0.5 }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserMessage;