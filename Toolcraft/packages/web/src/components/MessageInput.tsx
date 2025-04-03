// packages/web/src/components/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onImageUpload: (image: File, caption?: string) => Promise<void>;
  onFileUpload: (file: File, caption?: string) => Promise<void>;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onImageUpload, 
  onFileUpload, 
  isLoading 
}) => {
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'file' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === '' || isLoading) return;
    
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      setUploadType(type);
      setUploadDialogOpen(true);
    }
    
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile || !uploadType) return;
    
    try {
      if (uploadType === 'image') {
        await onImageUpload(uploadFile, uploadCaption || undefined);
      } else {
        await onFileUpload(uploadFile, uploadCaption || undefined);
      }
    } catch (error) {
      console.error(`Error uploading ${uploadType}:`, error);
    }
    
    // Reset upload state
    setUploadDialogOpen(false);
    setUploadFile(null);
    setUploadType(null);
    setUploadCaption('');
  };

  const handleUploadCancel = () => {
    setUploadDialogOpen(false);
    setUploadFile(null);
    setUploadType(null);
    setUploadCaption('');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const isImage = file.type.startsWith('image/');
        
        setUploadFile(file);
        setUploadType(isImage ? 'image' : 'file');
        setUploadDialogOpen(true);
      }
    },
    noClick: true,
    noKeyboard: true
  });

  return (
    <>
      <Box
        {...getRootProps()}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
          borderRadius: 2,
          border: isDragActive ? 2 : 0,
          borderColor: 'primary.main',
          borderStyle: isDragActive ? 'dashed' : 'solid',
          p: isDragActive ? 1 : 0
        }}
      >
        <input {...getInputProps()} />
        
        {isDragActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
              borderRadius: 2
            }}
          >
            <Typography variant="body1">Drop files here</Typography>
          </Box>
        )}
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              paddingRight: '100px', // Make room for buttons
            }
          }}
        />
        
        <Box sx={{ 
          position: 'absolute', 
          right: 8, 
          bottom: 8,
          display: 'flex'
        }}>
          <IconButton
            color="primary"
            onClick={handleMenuOpen}
            disabled={isLoading}
          >
            <AttachFileIcon />
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={isLoading || message.trim() === ''}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'file')}
      />
      
      {/* Attachment Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          imageInputRef.current?.click();
        }}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Upload Image</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          fileInputRef.current?.click();
        }}>
          <ListItemIcon>
            <FileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Upload File</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {uploadType === 'image' ? 'Upload Image' : 'Upload File'}
          <IconButton
            aria-label="close"
            onClick={handleUploadCancel}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {uploadFile && (
            <Box sx={{ mb: 2 }}>
              {uploadType === 'image' ? (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 2,
                  mb: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                  <FileIcon sx={{ mr: 1 }} />
                  <Typography>
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Add a caption (optional)"
                variant="outlined"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadCancel}>Cancel</Button>
          <Button 
            onClick={handleUploadConfirm} 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageInput;