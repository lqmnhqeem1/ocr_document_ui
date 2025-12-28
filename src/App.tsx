import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import UploadForm from './components/UploadForm';
import DocumentsList from './components/DocumentsList';
import ComparePage from './components/ComparePage';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger refresh in DocumentsList component
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectDocument = (pdfPath: string, fileName: string) => {
    // This will be handled by routing now
    window.location.href = `/compare?file=${encodeURIComponent(pdfPath)}&name=${encodeURIComponent(fileName)}`;
  };

  return (
    <Router>
      <Routes>
        <Route path="/compare" element={<ComparePage />} />
        <Route
          path="/"
          element={
            <div className="App">
              <div className="app-container">
                <div className="left-pane">
                  <div className="container">
                    <h1>📄 Document Upload</h1>
                    <UploadForm onUploadSuccess={handleUploadSuccess} />
                    <DocumentsList refreshTrigger={refreshTrigger} onSelectDocument={handleSelectDocument} />
                  </div>
                </div>

                <div className="right-pane">
                  <div className="empty-right-pane">
                    <p>Select a document to compare</p>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
