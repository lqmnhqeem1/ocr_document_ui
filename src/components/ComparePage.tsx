import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PDFViewer from './PDFViewer';

/* ---------- Types ---------- */

type OCRPage = {
  page: number;
  text: string;
};

interface OCRResult {
  file_name: string;
  pages: number;
  ocr_text: OCRPage[];
}

/* ---------- Component ---------- */

function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pdfPath = searchParams.get('file');
  const fileName = searchParams.get('name') || '';

  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pdfPath) return;

    const fetchOCR = async () => {
      setLoading(true);
      setError('');
      setOcrResult(null);

      try {
        /* ---- Load PDF ---- */
        const response = await fetch(pdfPath);
        const blob = await response.blob();

        /* ---- Convert to Base64 ---- */
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              // Strip the data: URL prefix
              const base64Data = reader.result.split(',')[1];
              resolve(base64Data);
            } else {
              reject('Failed to read PDF');
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        console.log('Base64 PDF:', base64); // ✅ Only one conversion
        const apiPdfUrl = `http://localhost:5000/api/documents/${fileName}`;
        /* ---- Call OCR API ---- */
        const ocrResponse = await fetch(
          'http://localhost:8000/azuredoc-ocr/base64',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_name: fileName,
              base64_pdf: base64,
            }),
          }
        );

        const data = await ocrResponse.json();

        if (!ocrResponse.ok) {
          throw new Error(data.detail || 'OCR failed');
        }

        setOcrResult({
          file_name: data.file_name,
          pages: data.pages ?? 0,
          ocr_text: Array.isArray(data.ocr_text) ? data.ocr_text : [],
        });
      } catch (err) {
        console.error(err);
        setError('Error processing OCR');
      } finally {
        setLoading(false);
      }
    };

    fetchOCR();
  }, [pdfPath, fileName]);

  /* ---------- UI ---------- */

  return (
    <div className="compare-page">
      <div className="compare-container">
        {/* LEFT PANE */}
        <div className="compare-left-pane">
          {pdfPath && <PDFViewer pdfFile={pdfPath} fileName={fileName} />}
        </div>

        {/* RIGHT PANE */}
        <div className="compare-right-pane">
          <div className="compare-right-header">
            <h2>📋 OCR Result</h2>
            <button className="back-button" onClick={() => navigate('/')}>
              ← Back
            </button>
          </div>

          <div className="compare-right-content">
            {loading && <p>Processing OCR…</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && ocrResult && (
              <>
                <p>
                  <strong>File:</strong> {ocrResult.file_name}
                </p>
                <p>
                  <strong>Total Pages:</strong> {ocrResult.pages}
                </p>

                {ocrResult.ocr_text.length === 0 ? (
                  <p>No OCR text detected.</p>
                ) : (
                  ocrResult.ocr_text.map((page) => (
                    <div key={page.page} style={{ marginBottom: '20px' }}>
                      <h4>Page {page.page}</h4>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{page.text}</pre>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparePage;
