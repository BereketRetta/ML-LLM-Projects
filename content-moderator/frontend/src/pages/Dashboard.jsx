import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  Box,
  Grid,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { moderateContent, getModerationHistory } from '../services/api';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
}));

const Dashboard = () => {
  const [content, setContent] = useState('');
  const [moderationResult, setModerationResult] = useState(null);
  
  // Fetch moderation history
  const { data: historyData, isLoading: historyLoading } = useQuery(
    'moderationHistory',
    () => getModerationHistory(5).then((res) => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
  
  // Moderation mutation
  const { mutate, isLoading, error } = useMutation(
    (data) => moderateContent(data).then((res) => res.data),
    {
      onSuccess: (data) => {
        setModerationResult(data);
      },
    }
  );
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    mutate({
      content,
      content_type: 'text',
    });
  };
  
  // Render category score
  const renderCategoryScore = (category, score) => {
    let color = 'success';
    if (score > 0.7) color = 'error';
    else if (score > 0.4) color = 'warning';
    
    return (
      <Box key={category} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">{category}</Typography>
          <Typography variant="body2" fontWeight="bold">
            {(score * 100).toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score * 100}
          color={color}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    );
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Content Moderation Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Content Submission Form */}
        <Grid item xs={12} md={8}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Submit Content for Moderation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter content to analyze using your personalized moderation preferences.
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Enter content to moderate..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading || !content.trim()}
                sx={{ minWidth: 150 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Content'
                )}
              </Button>
            </form>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error: {error.message || 'Something went wrong'}
              </Alert>
            )}
          </StyledPaper>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Moderation Stats
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Content Analyzed
                    </Typography>
                    <Typography variant="h4">
                      {historyLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        historyData?.length || 0
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Flagged Content
                    </Typography>
                    <Typography variant="h4">
                      {historyLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        historyData?.filter((item) => item.flagged)?.length || 0
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
              Recent Activity
            </Typography>
            
            {historyLoading ? (
              <CircularProgress />
            ) : historyData && historyData.length > 0 ? (
              historyData.map((item, index) => (
                <Box key={item.content_id || index} sx={{ mb: 2 }}>
                  <Typography variant="body2" noWrap>
                    {item.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      size="small"
                      color={item.flagged ? 'error' : 'success'}
                      label={item.flagged ? 'Flagged' : 'Approved'}
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {item.timestamp}
                    </Typography>
                  </Box>
                  {index < historyData.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent moderation history found.
              </Typography>
            )}
          </StyledPaper>
        </Grid>
        
        {/* Moderation Results */}
        {moderationResult && (
          <Grid item xs={12}>
            <StyledPaper elevation={2}>
              <Typography variant="h6" gutterBottom>
                Moderation Results
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Chip
                  color={moderationResult.flagged ? 'error' : 'success'}
                  label={
                    moderationResult.flagged
                      ? 'Content Flagged'
                      : 'Content Approved'
                  }
                  sx={{ mb: 2 }}
                />
                
                {moderationResult.flagged && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Flagged Categories:{' '}
                    {moderationResult.flagged_categories
                      .map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1))
                      .join(', ')}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Detailed Analysis
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Category Scores
                  </Typography>
                  
                  {Object.entries(moderationResult.scores || {}).map(
                    ([category, score]) => renderCategoryScore(category, score)
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Explanation
                  </Typography>
                  <Typography variant="body2">
                    {moderationResult.explanation}
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Button variant="outlined" size="small">
                      Provide Feedback
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;