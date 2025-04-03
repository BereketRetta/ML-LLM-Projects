// packages/web/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import ChatPage from './pages/ChatPage';
import ConversationsPage from './pages/ConversationsPage';

// Context providers
import { ConversationProvider } from './context/ConversationContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConversationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<ConversationsPage />} />
              <Route path="chat/:conversationId" element={<ChatPage />} />
            </Route>
          </Routes>
        </Router>
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;