import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker - use the public folder
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;


interface PDFViewerProps {
  pdfFile: string | null;
  fileName?: string;
}

function PDFViewer({ pdfFile, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPreviousPage = () => {
    setPageNumber(Math.max(pageNumber - 1, 1));
  };

  const goToNextPage = () => {
    if (numPages) {
      setPageNumber(Math.min(pageNumber + 1, numPages));
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  // Convert relative path to backend URL
  const getPdfUrl = () => {
    if (!pdfFile) return null;
    if (pdfFile.startsWith('http')) {
      return pdfFile;
    }
    return `http://localhost:5000${pdfFile}`;
  };

  const pdfUrl = getPdfUrl();

  return (
    <div className="pdf-viewer-container">
      <div className="pdf-header">
        <h3>📑 PDF Viewer</h3>
        {fileName && <p className="pdf-filename">{fileName}</p>}
      </div>

      {pdfUrl ? (
        <div className="pdf-content">
          <div className="pdf-controls">
            <div className="pdf-nav-controls">
              <button
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
                className="pdf-nav-button"
              >
                ← Previous
              </button>
              <span className="pdf-page-info">
                Page {pageNumber} of {numPages || '...'}
              </span>
              <button
                onClick={goToNextPage}
                disabled={!numPages || pageNumber >= numPages}
                className="pdf-nav-button"
              >
                Next →
              </button>
            </div>

            <div className="pdf-zoom-controls">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="pdf-zoom-button"
                title="Zoom Out"
              >
                🔍−
              </button>
              <span className="pdf-zoom-display">{zoom}%</span>
              <button
                onClick={handleResetZoom}
                className="pdf-zoom-button"
                title="Reset Zoom"
              >
                ⟲
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="pdf-zoom-button"
                title="Zoom In"
              >
                🔍+
              </button>
            </div>
          </div>

          <div className="pdf-document">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error: any) => {
                console.error('PDF Load Error:', error);
              }}
              error={
                <div className="pdf-error">Failed to load PDF. Please try another file.</div>
              }
              loading={<div className="pdf-loading">Loading PDF...</div>}
            >
              <Page pageNumber={pageNumber} scale={zoom / 100} />
            </Document>
          </div>
        </div>
      ) : (
        <div className="pdf-empty">
          <p>Select a PDF document to view</p>
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
