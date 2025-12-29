import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import './ComparePage.css';

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
        const response = await fetch("http://localhost:5000" + pdfPath);
        const blob = await response.blob();

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              const base64Data = reader.result.split(',')[1];
              resolve(base64Data);
            } else {
              reject('Failed to read PDF');
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        console.log("base64",base64);
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

  /* ---------- Helper: Parse OCR page into table rows ---------- */
  const parsePageToTable = (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    const headerIndex = lines.findIndex((line) => line === 'Item');
    if (headerIndex === -1) return null;

    const headers = lines.slice(headerIndex + 1, headerIndex + 7);
    const dataLines = lines.slice(headerIndex + 7);
    const rows: any[] = [];
    for (let i = 0; i < dataLines.length; i += 6) {
      if (i + 5 >= dataLines.length) break;
      rows.push({
        name: dataLines[i].replace(/^\d+\s/, ''),
        nric: dataLines[i + 1],
        basic: dataLines[i + 2],
        epfYer: dataLines[i + 3],
        epfEe: dataLines[i + 4],
        totalEpf: dataLines[i + 5],
      });
    }

    return { headers, rows };
  };

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
                {ocrResult.ocr_text.length === 0 ? (
                  <p>No OCR text detected.</p>
                ) : (
                  ocrResult.ocr_text.map((page) => {
                    const tableData = parsePageToTable(page.text);

                    return (
                      <div
                        key={page.page}
                        style={{
                          marginBottom: '24px',
                          padding: '12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '6px',
                          overflowX: 'auto',
                        }}
                      >
                        <h4 style={{ marginBottom: '12px' }}>Page {page.page}</h4>

                        {tableData ? (
                          <table
                            style={{
                              borderCollapse: 'collapse',
                              width: '100%',
                            }}
                          >
                            <thead>
                              <tr>
                                {tableData.headers.map((header: string) => (
                                  <th
                                    key={header}
                                    style={{
                                      border: '1px solid #ddd',
                                      padding: '8px',
                                      textAlign: 'left',
                                      backgroundColor: '#e0e0e0',
                                    }}
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.rows.map((row, idx) => (
                                <tr key={idx}>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.name}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.nric}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.basic}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.epfYer}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.epfEe}</td>
                                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.totalEpf}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: 'monospace',
                            }}
                          >
                            {page.text}
                          </div>
                        )}
                      </div>
                    );
                  })
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
