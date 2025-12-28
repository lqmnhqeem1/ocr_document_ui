import React, { useState, useEffect } from 'react';

export interface Document {
  filename: string;
  size: number;
  uploadedAt: string;
}

interface DocumentsListProps {
  refreshTrigger?: number;
  onSelectDocument: (pdfPath: string, fileName: string, ocrResult: any) => void;
}

function DocumentsList({ refreshTrigger, onSelectDocument }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchDocuments();
    }
  }, [refreshTrigger]);

  const isPDF = (filename: string) => filename.toLowerCase().endsWith('.pdf');

  const getOriginalFilename = (filename: string) => {
    const lastUnderscoreIndex = filename.lastIndexOf('_');
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastUnderscoreIndex > 0 && lastDotIndex > lastUnderscoreIndex) {
      return filename.substring(0, lastUnderscoreIndex) + filename.substring(lastDotIndex);
    }
    return filename;
  };

  const handleCompare = async (filename: string) => {
    setLoadingOCR(filename);

    try {
      // Fetch the PDF as blob from uploads folder
      const pdfResponse = await fetch(`http://localhost:5000/uploads/${filename}`);
      const blob = await pdfResponse.blob();

      // Convert blob to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Call OCR API
      const ocrResponse = await fetch('http://localhost:5000/azuredoc-ocr/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: base64 })
      });

      const ocrResult = await ocrResponse.json();

      console.log("DocumentList ocrResult:",ocrResult);

      // Callback with PDF path, original filename, and OCR result
      onSelectDocument(`/uploads/${filename}`, getOriginalFilename(filename), ocrResult);
    } catch (error) {
      console.error('OCR processing failed:', error);
      onSelectDocument(`/uploads/${filename}`, getOriginalFilename(filename), { error: 'OCR failed' });
    } finally {
      setLoadingOCR(null);
    }
  };

  return (
    <div className="documents-section">
      <div className="section-header">
        <h2>Uploaded Documents</h2>
        <button className="refresh-button" onClick={fetchDocuments} disabled={loadingDocuments}>
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
                  <td>{getOriginalFilename(doc.filename)}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>{formatDate(doc.uploadedAt)}</td>
                  <td>
                    {isPDF(doc.filename) ? (
                      <button
                        className="compare-button"
                        onClick={() => handleCompare(doc.filename)}
                        disabled={loadingOCR === doc.filename}
                      >
                        {loadingOCR === doc.filename ? 'Processing...' : '👁️ Compare'}
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
