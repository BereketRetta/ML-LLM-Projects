import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Slider,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { 
  getUserPreferences, 
  updateUserPreferences, 
  resetUserPreferences
} from '../services/api';
import { useAuth } from '../services/auth';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
}));

const PreferenceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const CategorySlider = ({ 
  category, 
  value, 
  onChange, 
  disabled = false,
  description 
}) => {
  // Format category name
  const formatCategory = (str) => {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography id={`${category}-slider`} gutterBottom>
          {formatCategory(category)}
        </Typography>
        <Tooltip title={description || `Set sensitivity threshold for ${formatCategory(category)} content`}>
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Slider
        value={value}
        onChange={(e, newValue) => onChange(category, newValue)}
        disabled={disabled}
        aria-labelledby={`${category}-slider`}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
        step={0.05}
        marks
        min={0}
        max={1}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Less Strict
        </Typography>
        <Typography variant="caption" color="text.secondary">
          More Strict
        </Typography>
      </Box>
    </Box>
  );
};

const Preferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get user preferences
  const { data: preferencesData, isLoading, error } = useQuery(
    'userPreferences',
    () => getUserPreferences().then((res) => res.data)
  );
  
  // Initialize form state
  const [formState, setFormState] = useState({
    sensitivity: 0.7,
    category_thresholds: {},
    category_weights: {},
    custom_rules: []
  });
  
  // Update form state when data is loaded
  React.useEffect(() => {
    if (preferencesData?.preferences) {
      setFormState({
        sensitivity: preferencesData.preferences.sensitivity || 0.7,
        category_thresholds: preferencesData.preferences.category_thresholds || {},
        category_weights: preferencesData.preferences.category_weights || {},
        custom_rules: preferencesData.preferences.custom_rules || []
      });
    }
  }, [preferencesData]);
  
  // Handle mutations
  const updateMutation = useMutation(
    (data) => updateUserPreferences(data).then((res) => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userPreferences');
      }
    }
  );
  
  const resetMutation = useMutation(
    () => resetUserPreferences().then((res) => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userPreferences');
      }
    }
  );
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formState);
  };
  
  // Handle reset
  const handleReset = () => {
    resetMutation.mutate();
  };
  
  // Handle sensitivity change
  const handleSensitivityChange = (event, newValue) => {
    setFormState({
      ...formState,
      sensitivity: newValue
    });
  };
  
  // Handle category threshold change
  const handleCategoryThresholdChange = (category, newValue) => {
    setFormState({
      ...formState,
      category_thresholds: {
        ...formState.category_thresholds,
        [category]: newValue
      }
    });
  };
  
  // Handle adding custom rule
  const [newRule, setNewRule] = useState('');
  
  const handleAddRule = () => {
    if (newRule.trim()) {
      setFormState({
        ...formState,
        custom_rules: [...formState.custom_rules, newRule.trim()]
      });
      setNewRule('');
    }
  };
  
  // Handle removing custom rule
  const handleRemoveRule = (index) => {
    const updatedRules = [...formState.custom_rules];
    updatedRules.splice(index, 1);
    setFormState({
      ...formState,
      custom_rules: updatedRules
    });
  };
  
  // Default categories if none provided
  const defaultCategories = [
    'hate',
    'harassment', 
    'sexual', 
    'self-harm', 
    'violence', 
    'graphic', 
    'illegal-activity', 
    'misinformation'
  ];
  
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Moderation Preferences
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Customize how content is moderated according to your preferences.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading preferences: {error.message}
        </Alert>
      )}
      
      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error saving preferences: {updateMutation.error.message}
        </Alert>
      )}
      
      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Preferences saved successfully.
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Global Sensitivity */}
          <Grid item xs={12} md={6}>
            <StyledPaper elevation={2}>
              <Typography variant="h6" gutterBottom>
                Global Sensitivity
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Control the overall sensitivity of the content moderation system.
              </Typography>
              
              <Box sx={{ px: 1 }}>
                <Slider
                  value={formState.sensitivity}
                  onChange={handleSensitivityChange}
                  aria-labelledby="sensitivity-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  step={0.05}
                  marks
                  min={0}
                  max={1}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Less Strict</Typography>
                  <Typography variant="body2">More Strict</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Current Setting: <strong>{(formState.sensitivity * 100).toFixed(0)}%</strong>
                </Typography>
                <Chip 
                  label={
                    formState.sensitivity < 0.4 ? "Permissive" : 
                    formState.sensitivity < 0.7 ? "Balanced" : "Strict"
                  }
                  color={
                    formState.sensitivity < 0.4 ? "success" : 
                    formState.sensitivity < 0.7 ? "primary" : "error"
                  }
                  size="small"
                />
              </Box>
            </StyledPaper>
          </Grid>
          
          {/* Preferences Summary */}
          <Grid item xs={12} md={6}>
            <StyledPaper elevation={2}>
              <Typography variant="h6" gutterBottom>
                Your Preference Profile
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <PreferenceCard variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Profile Version
                      </Typography>
                      <Typography variant="h5">
                        {preferencesData?.version || 1}
                      </Typography>
                    </CardContent>
                  </PreferenceCard>
                </Grid>
                
                <Grid item xs={6}>
                  <PreferenceCard variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Custom Rules
                      </Typography>
                      <Typography variant="h5">
                        {formState.custom_rules.length}
                      </Typography>
                    </CardContent>
                  </PreferenceCard>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" paragraph>
                  Your preferences are continuously optimized based on your feedback.
                  Provide feedback on moderation decisions to make the system more
                  accurate for your needs.
                </Typography>
                
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  disabled={resetMutation.isLoading}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </StyledPaper>
          </Grid>
          
          {/* Category-Specific Thresholds */}
          <Grid item xs={12}>
            <StyledPaper elevation={2}>
              <Typography variant="h6" gutterBottom>
                Category-Specific Thresholds
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Fine-tune sensitivity for specific content categories.
              </Typography>
              
              <Grid container spacing={3}>
                {(Object.keys(formState.category_thresholds).length > 0 
                  ? Object.keys(formState.category_thresholds) 
                  : defaultCategories
                ).map((category) => (
                  <Grid item xs={12} md={6} key={category}>
                    <CategorySlider
                      category={category}
                      value={formState.category_thresholds[category] || formState.sensitivity}
                      onChange={handleCategoryThresholdChange}
                    />
                  </Grid>
                ))}
              </Grid>
            </StyledPaper>
          </Grid>
          
          {/* Custom Rules */}
          <Grid item xs={12}>
            <StyledPaper elevation={2}>
              <Typography variant="h6" gutterBottom>
                Custom Moderation Rules
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add specific rules to guide content moderation.
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="E.g., Flag content mentioning specific keywords..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleAddRule}
                  disabled={!newRule.trim()}
                  sx={{ ml: 2 }}
                >
                  Add Rule
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box>
                {formState.custom_rules.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No custom rules added yet.
                  </Typography>
                ) : (
                  formState.custom_rules.map((rule, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="body2">{rule}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRule(index)}
                        aria-label="delete rule"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={updateMutation.isLoading}
            sx={{ minWidth: 150 }}
          >
            {updateMutation.isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default Preferences;