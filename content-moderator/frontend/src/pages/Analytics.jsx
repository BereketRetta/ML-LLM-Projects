import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { getFeedbackStats } from '../services/api';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  height: '100%',
}));

const Analytics = () => {
  // Fetch feedback stats
  const { data: statsData, isLoading, error } = useQuery(
    'feedbackStats',
    () => getFeedbackStats().then((res) => res.data)
  );
  
  // Mock data for charts
  const generateMockData = () => {
    // Categories
    const categories = [
      'hate',
      'harassment',
      'sexual',
      'self-harm',
      'violence',
      'graphic',
      'illegal-activity',
      'misinformation'
    ];
    
    // Mock data for flagged categories distribution
    const flaggedDistribution = {
      labels: categories,
      datasets: [
        {
          label: 'Flagged Content by Category',
          data: categories.map(() => Math.floor(Math.random() * 100)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Mock data for daily moderation activity
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dailyActivity = {
      labels: days,
      datasets: [
        {
          label: 'Flagged Content',
          data: days.map(() => Math.floor(Math.random() * 30)),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'Approved Content',
          data: days.map(() => Math.floor(Math.random() * 70)),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
    
    // Mock data for feedback impact
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const feedbackImpact = {
      labels: months,
      datasets: [
        {
          label: 'Accuracy Improvement',
          data: months.map((_, index) => 0.6 + (index * 0.05)),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          tension: 0.3,
        },
      ],
    };
    
    return {
      flaggedDistribution,
      dailyActivity,
      feedbackImpact,
    };
  };
  
  // Generate mock chart data
  const mockCharts = React.useMemo(() => generateMockData(), []);
  
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading analytics data: {error.message}
      </Alert>
    );
  }
  
  // In a real app, we would use statsData instead of mockCharts
  // Using mock data here for visualization purposes
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Moderation Analytics
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Insights and statistics from your content moderation activities.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Feedback Impact */}
        <Grid item xs={12} md={8}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Moderation Accuracy Over Time
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              How your feedback has improved moderation accuracy.
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <Line
                data={mockCharts.feedbackImpact}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 0.5,
                      max: 1,
                    },
                  },
                }}
              />
            </Box>
          </StyledPaper>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Moderation Statistics
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Feedback Submissions
              </Typography>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {statsData?.total_feedback_count || 42}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Agreement Rate
              </Typography>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {statsData?.agreement_rate 
                  ? `${(statsData.agreement_rate * 100).toFixed(1)}%` 
                  : '85.0%'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Accuracy Improvement
              </Typography>
              <Typography variant="h3">
                {statsData?.feedback_impact?.accuracy_improvement
                  ? `+${(statsData.feedback_impact.accuracy_improvement * 100).toFixed(1)}%`
                  : '+12.0%'}
              </Typography>
            </Box>
          </StyledPaper>
        </Grid>
        
        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Flagged Content by Category
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of content flags across different categories.
            </Typography>
            
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie
                data={mockCharts.flaggedDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </StyledPaper>
        </Grid>
        
        {/* Daily Activity */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Weekly Moderation Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Number of moderated content items per day.
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <Bar
                data={mockCharts.dailyActivity}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      stacked: false,
                    },
                    y: {
                      stacked: false,
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Box>
          </StyledPaper>
        </Grid>
        
        {/* Disagreement Categories */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Feedback Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Categories where user feedback often disagrees with the AI.
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <Bar
                data={{
                  labels: Object.keys(statsData?.disagreement_categories || {
                    hate: 0.4,
                    harassment: 0.3,
                    misinformation: 0.2,
                    other: 0.1,
                  }),
                  datasets: [
                    {
                      label: 'Disagreement Rate',
                      data: Object.values(statsData?.disagreement_categories || {
                        hate: 0.4,
                        harassment: 0.3,
                        misinformation: 0.2,
                        other: 0.1,
                      }).map(val => val * 100),
                      backgroundColor: 'rgba(153, 102, 255, 0.5)',
                      borderColor: 'rgba(153, 102, 255, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Disagreement Rate (%)',
                      },
                    },
                  },
                }}
              />
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;