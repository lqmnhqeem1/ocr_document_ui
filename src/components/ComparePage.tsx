import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PDFViewer from './PDFViewer';

function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const pdfPath = searchParams.get('file') || null;
  const fileName = searchParams.get('name') || '';

  return (
    <div className="compare-page">
      <div className="compare-container">
        <div className="compare-left-pane">
          <PDFViewer pdfFile={pdfPath} fileName={fileName} />
        </div>

        <div className="compare-right-pane">
          <div className="compare-right-header">
            <h2>📋 Comparison Panel</h2>
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              ← Back
            </button>
          </div>
          <div className="compare-right-content">
            <p>Content coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparePage;
