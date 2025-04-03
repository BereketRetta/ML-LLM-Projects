// packages/web/src/contexts/ConversationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserInput, AgentResponse } from '@toolcraft/shared';
import api from '../services/api';

// Default user ID to use for all requests
const DEFAULT_USER_ID = 'user-default';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentMessages: (UserInput | AgentResponse)[];
  isLoading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  setCurrentConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  uploadImage: (image: File, content?: string) => Promise<void>;
  uploadFile: (file: File, content?: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<(UserInput | AgentResponse)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/conversation?userId=${DEFAULT_USER_ID}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to fetch conversations');
      
      // If API fails, create a mock conversation to allow interaction
      if (conversations.length === 0) {
        const mockConversation = {
          id: `conv-${uuidv4()}`,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0
        };
        setConversations([mockConversation]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (title?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/conversation', {
        userId: DEFAULT_USER_ID,
        title: title || 'New Conversation'
      });

      const newConversation = response.data;
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation');
      
      // Create a client-side conversation if API fails
      const mockId = `conv-${uuidv4()}`;
      const mockConversation = {
        id: mockId,
        title: title || 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0
      };
      
      setConversations(prev => [mockConversation, ...prev]);
      return mockId;
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch conversation details
      const detailsResponse = await api.get(`/conversation/${conversationId}`, {
        params: { userId: DEFAULT_USER_ID }
      });
      
      const selectedConversation = detailsResponse.data;
      setCurrentConversation(selectedConversation);

      // Fetch messages for the conversation
      const messagesResponse = await api.get(`/conversation/${conversationId}/messages`, {
        params: { userId: DEFAULT_USER_ID }
      });
      
      setCurrentMessages(messagesResponse.data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
      
      // Set a basic conversation if API fails
      if (!currentConversation) {
        const conversation = conversations.find(c => c.id === conversationId) || {
          id: conversationId,
          title: 'Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setCurrentConversation(conversation);
        setCurrentMessages([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create a temporary message to show in the UI immediately
      const tempUserInput: UserInput = {
        id: `temp-${uuidv4()}`,
        type: 'text',
        content,
        timestamp: new Date().toISOString()
      };

      // Add to current messages for immediate feedback
      setCurrentMessages(prev => [...prev, tempUserInput]);

      // Send to API
      const response = await api.post('/agent/process-text', {
        userId: DEFAULT_USER_ID,
        conversationId: currentConversation.id,
        content
      });

      // Replace temp message with actual response
      setCurrentMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserInput.id),
        {
          ...tempUserInput,
          id: `input-${Date.now()}`
        },
        response.data
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      
      // Remove the temporary message if the API call fails
      setCurrentMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('temp-'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (image: File, content?: string) => {
    if (!currentConversation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('userId', DEFAULT_USER_ID);
      formData.append('conversationId', currentConversation.id);
      
      if (content) {
        formData.append('content', content);
      }

      // Create a temporary message to show in the UI immediately
      const tempUserInput: UserInput = {
        id: `temp-${uuidv4()}`,
        type: 'image',
        content: content || 'Image upload',
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(image)
      };

      // Add to current messages for immediate feedback
      setCurrentMessages(prev => [...prev, tempUserInput]);

      // Send to API
      const response = await api.post('/agent/process-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Replace temp message with actual response
      setCurrentMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserInput.id),
        {
          ...tempUserInput,
          id: `input-${Date.now()}`
        },
        response.data
      ]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
      
      // Remove the temporary message if the API call fails
      setCurrentMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('temp-'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, content?: string) => {
    if (!currentConversation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', DEFAULT_USER_ID);
      formData.append('conversationId', currentConversation.id);
      
      if (content) {
        formData.append('content', content);
      }

      // Create a temporary message to show in the UI immediately
      const tempUserInput: UserInput = {
        id: `temp-${uuidv4()}`,
        type: 'file',
        content: content || 'File upload',
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileType: file.type
      };

      // Add to current messages for immediate feedback
      setCurrentMessages(prev => [...prev, tempUserInput]);

      // Send to API
      const response = await api.post('/agent/process-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Replace temp message with actual response
      setCurrentMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserInput.id),
        {
          ...tempUserInput,
          id: `input-${Date.now()}`
        },
        response.data
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      
      // Remove the temporary message if the API call fails
      setCurrentMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('temp-'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConversationContext.Provider 
      value={{
        conversations,
        currentConversation,
        currentMessages,
        isLoading,
        error,
        fetchConversations,
        createConversation,
        setCurrentConversation: loadConversation,
        sendMessage,
        uploadImage,
        uploadFile
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};