import React, { useState } from 'react';

interface UploadFormProps {
  onUploadSuccess: () => void;
}

function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      setUploading(true);
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`File "${selectedFile.name}" uploaded successfully!`);
        setMessageType('success');
        setSelectedFile(null);
        // Clear file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Callback to refresh documents list
        onUploadSuccess();
      } else {
        setMessage(data.error || 'Upload failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error uploading file. Make sure the server is running on port 5000.');
      setMessageType('error');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-wrapper">
          <label htmlFor="fileInput" className="file-label">
            Choose Document
          </label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
            className="file-input"
            disabled={uploading}
          />
          {selectedFile && (
            <span className="selected-file">
              ✓ {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </span>
          )}
        </div>

        <button
          type="submit"
          className="upload-button"
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UploadForm;
