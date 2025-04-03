// packages/web/src/pages/ConversationsPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Chat as ChatIcon
} from '@mui/icons-material';
import { useConversation } from '../context/ConversationContext';

const ConversationsPage: React.FC = () => {
  const { conversations, isLoading, error, createConversation, fetchConversations } = useConversation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewConversation = async () => {
    try {
      const conversationId = await createConversation();
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  if (isLoading && conversations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Your Conversations</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleNewConversation}
        >
          New Conversation
        </Button>
      </Box>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Conversations Grid */}
      {conversations.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4, backgroundColor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No conversations yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Start a new conversation to get help from the Toolcraft AI Assistant.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
          >
            New Conversation
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {conversations.map((conversation) => (
            <Grid item xs={12} sm={6} md={4} key={conversation.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {conversation.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(conversation.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(conversation.updatedAt).toLocaleDateString()}
                  </Typography>
                  {conversation.messageCount !== undefined && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {conversation.messageCount} messages
                    </Typography>
                  )}
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleOpenConversation(conversation.id)}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ConversationsPage;