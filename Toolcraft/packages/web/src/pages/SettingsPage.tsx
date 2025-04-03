// packages/web/src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  TextField,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../context/ConversationContext';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isLoading } = useConversation();
  
  const [showAgentThinking, setShowAgentThinking] = useState(true);
  const [showToolOutputs, setShowToolOutputs] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:3001');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleSaveSettings = () => {
    // In a real app, this would save to the API
    // For now, just show a success message
    setSnackbarMessage('Settings saved successfully');
    setSnackbarOpen(true);
  };
  
  const handleClearMemory = () => {
    // In a real app, this would call the API to clear memory
    setSnackbarMessage('Memory cleared successfully');
    setSnackbarOpen(true);
  };
  
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please log in to access settings.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {/* User Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          User Profile
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Username:</strong> {user?.username}
          </Typography>
          <Typography variant="body1">
            <strong>User ID:</strong> {user?.id}
          </Typography>
        </Box>
      </Paper>
      
      {/* Interface Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Interface Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={showAgentThinking}
              onChange={(e) => setShowAgentThinking(e.target.checked)}
              color="primary"
            />
          }
          label="Show Agent Thinking Process"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={showToolOutputs}
              onChange={(e) => setShowToolOutputs(e.target.checked)}
              color="primary"
            />
          }
          label="Show Tool Outputs"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={darkTheme}
              onChange={(e) => setDarkTheme(e.target.checked)}
              color="primary"
            />
          }
          label="Dark Theme"
        />
      </Paper>
      
      {/* API Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          API Settings
        </Typography>
        
        <TextField
          label="API Endpoint"
          variant="outlined"
          fullWidth
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          margin="normal"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          This setting is for demonstration purposes only.
        </Typography>
      </Paper>
      
      {/* Memory Management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Memory Management
        </Typography>
        
        <Button 
          variant="outlined" 
          color="warning"
          onClick={handleClearMemory}
          disabled={isLoading}
          sx={{ mt: 1 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Clear Agent Memory'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This will clear all memory associated with your account. The agent will no longer remember past conversations.
        </Typography>
      </Paper>
      
      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
      
      {/* Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default SettingsPage;