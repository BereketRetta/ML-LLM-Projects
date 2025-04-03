// packages/web/src/components/AgentMessage.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Card,
  CardMedia,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { AgentResponse, AgentStep } from '@toolcraft/shared';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface AgentMessageProps {
  message: AgentResponse;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  // Custom renderer for code blocks in markdown
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={docco}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'flex-start',
      mb: 2
    }}>
      <Box sx={{ maxWidth: '80%' }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '18px 18px 18px 4px',
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider'
          }}
        >
          {message.type === 'error' ? (
            <Typography color="error">
              {message.content}
            </Typography>
          ) : message.type === 'image' && message.imageUrl ? (
            <Box>
              <ReactMarkdown components={components}>
                {message.content}
              </ReactMarkdown>
              <Card sx={{ mt: 2, borderRadius: 2 }}>
                <CardMedia
                  component="img"
                  image={message.imageUrl}
                  alt="AI generated image"
                  sx={{ maxHeight: 400, objectFit: 'contain' }}
                />
              </Card>
            </Box>
          ) : (
            <ReactMarkdown components={components}>
              {message.content}
            </ReactMarkdown>
          )}
        </Paper>
        
        {/* Tools and reasoning information */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {message.toolsUsed.map((tool, index) => (
                <Chip 
                  key={index}
                  icon={<BuildIcon fontSize="small" />}
                  label={tool}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Thinking process accordion */}
        {message.steps && message.steps.length > 0 && (
          <Accordion 
            expanded={expanded} 
            onChange={() => setExpanded(!expanded)}
            sx={{ 
              mt: 1, 
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: 1,
              borderColor: 'divider',
              borderRadius: '8px !important'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="thinking-content"
              id="thinking-header"
              sx={{ borderRadius: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">Thinking Process</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {message.steps.map((step: AgentStep, index: number) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Step {step.stepNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {step.reasoning}
                  </Typography>
                  
                  {step.requiresTool && (
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`Using tool: ${step.toolName}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      {step.toolParameters && (
                        <Box sx={{ mt: 1, ml: 2 }}>
                          <Typography variant="caption">Parameters:</Typography>
                          <Paper variant="outlined" sx={{ p: 1, mt: 0.5 }}>
                            <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {JSON.stringify(step.toolParameters, null, 2)}
                            </pre>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 0.5 }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
};

export default AgentMessage;