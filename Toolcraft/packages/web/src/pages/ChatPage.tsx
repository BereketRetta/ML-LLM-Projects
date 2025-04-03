// packages/web/src/pages/ChatPage.tsx
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useConversation } from '../context/ConversationContext';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { 
    currentConversation, 
    currentMessages, 
    isLoading, 
    error, 
    setCurrentConversation,
    sendMessage,
    uploadImage,
    uploadFile
  } = useConversation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      setCurrentConversation(conversationId);
    }
  }, [conversationId, setCurrentConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  // Handle message submission
  const handleSendMessage = async (content: string) => {
    if (!conversationId) {
      return;
    }
    
    await sendMessage(content);
  };

  // Handle image upload
  const handleImageUpload = async (image: File, caption?: string) => {
    if (!conversationId) {
      return;
    }
    
    await uploadImage(image, caption);
  };

  // Handle file upload
  const handleFileUpload = async (file: File, caption?: string) => {
    if (!conversationId) {
      return;
    }
    
    await uploadFile(file, caption);
  };

  if (!conversationId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h5">Select a conversation</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      position: 'relative'
    }}>
      {/* Conversation Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6">
          {currentConversation?.title || 'Loading...'}
        </Typography>
      </Paper>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        mb: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isLoading && currentMessages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MessageList messages={currentMessages} />
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input Area */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onImageUpload={handleImageUpload}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />
      </Paper>
    </Box>
  );
};

export default ChatPage;