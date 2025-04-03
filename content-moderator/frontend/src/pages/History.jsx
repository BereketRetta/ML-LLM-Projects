import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getModerationHistory } from '../services/api';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
}));

const History = () => {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch moderation history
  const { data: historyData, isLoading, error } = useQuery(
    ['moderationHistory', rowsPerPage],
    () => getModerationHistory(100).then((res) => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter content based on search query
  const filteredHistory = React.useMemo(() => {
    if (!historyData) return [];
    
    if (!searchQuery) return historyData;
    
    const lowerQuery = searchQuery.toLowerCase();
    return historyData.filter((item) => {
      return (
        item.content.toLowerCase().includes(lowerQuery) ||
        (item.flagged_categories &&
          item.flagged_categories.some((cat) =>
            cat.toLowerCase().includes(lowerQuery)
          ))
      );
    });
  }, [historyData, searchQuery]);
  
  // Paginated data
  const paginatedHistory = React.useMemo(() => {
    if (!filteredHistory) return [];
    
    return filteredHistory.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredHistory, page, rowsPerPage]);
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    // In a real app, format the timestamp properly
    return timestamp || 'N/A';
  };
  
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
        Error loading moderation history: {error.message}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Moderation History
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        View and analyze your content moderation history.
      </Typography>
      
      <StyledPaper elevation={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search moderation history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="body2">
            Total Records: {filteredHistory?.length || 0}
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Categories</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <TableRow key={item.content_id}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.flagged ? 'error' : 'success'}
                        label={item.flagged ? 'Flagged' : 'Approved'}
                      />
                    </TableCell>
                    <TableCell>
                      {item.flagged_categories?.length > 0 ? (
                        item.flagged_categories.map((category) => (
                          <Chip
                            key={category}
                            label={category}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatTimestamp(item.timestamp)}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" aria-label="view details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="info">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery
                        ? 'No matching records found.'
                        : 'No moderation history available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredHistory?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </StyledPaper>
    </Box>
  );
};

export default History;