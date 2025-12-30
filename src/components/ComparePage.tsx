import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import './ComparePage.css';

/* ---------- Types ---------- */

interface OCRPage {
  page: number;
  text: string;
}

interface TableData {
  table_name: string;
  columns: string[];
  rows: Record<string, string>[];
}

interface StructuredData {
  fields?: Record<string, string>;
  tables?: TableData[];
  prepared_by?: Record<string, string>;
  footer?: Record<string, string>;
  notes?: string[];
}

interface OCRResult {
  file_name: string;
  pages: number;
  ocr_text: OCRPage[];
  structured_data?: StructuredData;
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
        console.log("base64", base64);
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

        setOcrResult(data); // data now contains structured_data
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
                {/* Render fields */}
                {ocrResult.structured_data?.fields && Object.keys(ocrResult.structured_data.fields).length > 0 && (
                  <div>
                    <h4>Document Info</h4>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <tbody>
                        {Object.entries(ocrResult.structured_data.fields).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                {key}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Render tables */}
                {ocrResult.structured_data?.tables && ocrResult.structured_data.tables.length > 0 && (
                  ocrResult.structured_data.tables.map((table, idx) => (
                    <div key={idx}>
                      <h4>{table.table_name}</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              {table.columns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(table.rows) && table.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {typeof row === 'object' && row !== null ? (
                                  table.columns.map((col) => (
                                    <td key={col}>{row[col] || ''}</td>
                                  ))
                                ) : (
                                  <td>{String(row)}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}

                {/* Render prepared_by section */}
                {ocrResult.structured_data?.prepared_by && Object.keys(ocrResult.structured_data.prepared_by).length > 0 && (
                  <div>
                    <h4>Prepared By</h4>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <tbody>
                        {Object.entries(ocrResult.structured_data.prepared_by).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                {key}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Render footer section */}
                {ocrResult.structured_data?.footer && Object.keys(ocrResult.structured_data.footer).length > 0 && (
                  <div>
                    <h4>Footer</h4>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <tbody>
                        {Object.entries(ocrResult.structured_data.footer).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                {key}
                              </td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Render notes if any */}
                {ocrResult.structured_data?.notes && Array.isArray(ocrResult.structured_data.notes) && ocrResult.structured_data.notes.length > 0 && (
                  <div>
                    <h4>Notes</h4>
                    <ul>
                      {ocrResult.structured_data.notes.map((note, nIdx) => (
                        <li key={nIdx}>{note}</li>
                      ))}
                    </ul>
                  </div>
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
