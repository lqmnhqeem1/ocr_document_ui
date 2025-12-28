import React, { useState, useEffect } from 'react';
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

  /* ---------- Convert hardcoded PDF to Base64 ---------- */
  // useEffect(() => {
  //   const pdfPath = `${process.env.PUBLIC_URL}/uploads/eCOM Sample 1_1766918038336.pdf`; // Hardcoded PDF path
  //   const fileName = "eCOM Sample 1_1766918038336.pdf";

  //   const fetchAndConvertPDF = async () => {
  //     try {
  //       const response = await fetch(pdfPath);
  //       const blob = await response.blob();

  //       const base64 = await new Promise<string>((resolve, reject) => {
  //         const reader = new FileReader();
  //         reader.onloadend = () => {
  //           if (typeof reader.result === 'string') {
  //             resolve(reader.result.split(',')[1]); // Remove data: prefix
  //           } else {
  //             reject('Failed to read PDF');
  //           }
  //         };
  //         reader.onerror = reject;
  //         reader.readAsDataURL(blob);
  //       });

  //       console.log('Pdf Path:', pdfPath);
  //       console.log('File name:', fileName);
  //       console.log('Base64 string:', base64);
  //     } catch (err) {
  //       console.error('Error converting PDF to Base64:', err);
  //     }
  //   };

  //   fetchAndConvertPDF();
  // }, []);
  
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
