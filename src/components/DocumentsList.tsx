import React, { useState, useEffect } from 'react';

export interface Document {
  filename: string;
  size: number;
  uploadedAt: string;
}

interface DocumentsListProps {
  refreshTrigger?: number;
  onSelectDocument: (filename: string, originalName: string) => void;
}

function DocumentsList({ refreshTrigger, onSelectDocument }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch('http://localhost:5000/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch documents when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchDocuments();
    }
  }, [refreshTrigger]);

  const isPDF = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const getOriginalFilename = (filename: string) => {
    // Extract original filename from timestamp-based filename
    // Format: originalname_timestamp.ext
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastUnderscoreIndex > 0 && lastDotIndex > lastUnderscoreIndex) {
      return filename.substring(0, lastUnderscoreIndex) + filename.substring(lastDotIndex);
    }
    return filename;
  };

  const handleCompare = (filename: string) => {
    onSelectDocument(`/uploads/${filename}`, getOriginalFilename(filename));
  };

  return (
    <div className="documents-section">
      <div className="section-header">
        <h2>Uploaded Documents</h2>
        <button
          className="refresh-button"
          onClick={fetchDocuments}
          disabled={loadingDocuments}
        >
          {loadingDocuments ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loadingDocuments ? (
        <p className="loading">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="no-documents">No documents uploaded yet</p>
      ) : (
        <div className="documents-list">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Uploaded At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.filename}>
                  <td className="filename">{getOriginalFilename(doc.filename)}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>{formatDate(doc.uploadedAt)}</td>
                  <td className="action-cell">
                    {isPDF(doc.filename) ? (
                      <button
                        className="compare-button"
                        onClick={() => handleCompare(doc.filename)}
                      >
                        👁️ Compare
                      </button>
                    ) : (
                      <span className="not-pdf">Not PDF</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentsList;
