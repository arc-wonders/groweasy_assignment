'use client';

import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

interface CsvRow {
  [key: string]: string;
}

interface ImportResponse {
  imported: CsvRow[];
  skipped: CsvRow[];
  totalImported: number;
  totalSkipped: number;
}

const apiBaseUrl = '';

export default function HomePage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [selectedSection, setSelectedSection] = useState<'imported' | 'skipped' | null>(null);
  const [detailTab, setDetailTab] = useState<'imported' | 'skipped'>('imported');
  const [dragActive, setDragActive] = useState(false);
  const [parsingRows, setParsingRows] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const detailRows = selectedSection && result ? (detailTab === 'imported' ? result.imported : result.skipped) : [];
  const detailHeaders = useMemo(() => {
    if (!detailRows.length) {
      return [];
    }
    return Object.keys(detailRows[0]);
  }, [detailRows]);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }

    setFileName(file.name);
    setError('');
    setResult(null);
    setRows([]);
    setParsingRows(0);

    const parsedRows: CsvRow[] = [];
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      step: (result) => {
        parsedRows.push(result.data);
        setParsingRows(parsedRows.length);
        if (parsedRows.length % 50 === 0) {
          setRows([...parsedRows]);
        }
      },
      complete: () => {
        setRows([...parsedRows]);
        setParsingRows(parsedRows.length);
      },
      error: () => {
        setError('Unable to parse the selected CSV file.');
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    handleFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0] ?? Array.from(event.dataTransfer.items ?? []).find((item) => item.kind === 'file')?.getAsFile();
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setDragActive(false);
  };

  const handleImport = async () => {
    if (!rows.length) {
      setError('Please upload a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProcessingProgress(0);

    const totalBatches = Math.ceil(rows.length / 50);
    const progressTimer = setInterval(() => {
      setProcessingProgress((current) => Math.min(95, current + Math.max(3, Math.round(85 / totalBatches))));
    }, 500);

    try {
      const response = await fetch(`${apiBaseUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const text = await response.text();
      let payload: Partial<ImportResponse> & { message?: string } = {};

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(`Unexpected backend response: ${text.slice(0, 120)}`);
        }
      }

      if (!response.ok) {
        throw new Error(payload.message || 'Import failed.');
      }

      setResult(payload as ImportResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      clearInterval(progressTimer);
      setProcessingProgress(100);
      setLoading(false);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('light', !darkMode);
  }, [darkMode]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-semibold">GrowEasy AI CSV Importer</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Upload a CSV, review the parsed rows locally, and confirm the import to the AI-powered backend.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`rounded-xl border p-6 shadow-sm transition ${dragActive ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-800' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">CSV Upload</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Accepted format: .csv</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDarkMode((value) => !value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
                <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  Choose CSV
                </label>
              </div>
            </div>

            {fileName ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Selected file: {fileName}</p> : null}
            {parsingRows ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Parsing rows: {parsingRows}</p> : null}

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <button
                  onClick={handleImport}
                  disabled={loading || !rows.length}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:disabled:bg-slate-700"
                >
                  {loading ? 'Importing…' : 'Confirm Import'}
                </button>
              </div>

              {processingProgress > 0 ? (
                <div className="mt-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-slate-900 dark:bg-slate-200"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              ) : null}

              {rows.length ? (
                <div className="mt-4 h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-left dark:bg-slate-900">
                      <tr>
                        {headers.slice(0, 6).map((header) => (
                          <th key={header} className="border-b border-slate-200 px-3 py-2 font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={`${row.name ?? 'row'}-${index}`} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-950 dark:even:bg-slate-900">
                          {headers.slice(0, 6).map((header) => (
                            <td key={`${header}-${index}`} className="border-b border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                              {row[header] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center text-sm transition ${
                    dragActive
                      ? 'border-slate-900 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-slate-100'
                      : 'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  <div className="text-base font-medium">Drag and drop your CSV here</div>
                  <div className="mt-2">or use the Choose CSV button above to browse files.</div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Result</h2>
            {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            {loading ? (
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">Processing import with AI…</div>
            ) : null}

            {result ? (
              <div className="mt-4 space-y-3 text-sm">
                <div
                  className="cursor-pointer rounded-lg border border-slate-200 p-3 hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setSelectedSection('imported')}
                >
                  <div className="text-slate-500 dark:text-slate-400">Imported records</div>
                  <div className="text-xl font-semibold">{result.totalImported}</div>
                </div>
                <div
                  className="cursor-pointer rounded-lg border border-slate-200 p-3 hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setSelectedSection('skipped')}
                >
                  <div className="text-slate-500 dark:text-slate-400">Skipped records</div>
                  <div className="text-xl font-semibold">{result.totalSkipped}</div>
                </div>
                <div
                  className="cursor-pointer rounded-lg border border-slate-200 p-3 hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setSelectedSection('imported')}
                >
                  <div className="text-slate-500 dark:text-slate-400">Total imported</div>
                  <div className="text-xl font-semibold">{result.totalImported}</div>
                </div>
                <div
                  className="cursor-pointer rounded-lg border border-slate-200 p-3 hover:border-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setSelectedSection('skipped')}
                >
                  <div className="text-slate-500 dark:text-slate-400">Total skipped</div>
                  <div className="text-xl font-semibold">{result.totalSkipped}</div>
                </div>
              </div>
            ) : null}
            {selectedSection && result ? (
              <div className="absolute inset-0 z-20 bg-slate-900/30 p-4 backdrop-blur-sm">
                <div className="mx-auto flex h-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {detailTab === 'imported' ? 'Imported records' : 'Skipped records'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Review the selected records in a new tab panel.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSection(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        detailTab === 'imported'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                      onClick={() => setDetailTab('imported')}
                    >
                      Imported
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        detailTab === 'skipped'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                      onClick={() => setDetailTab('skipped')}
                    >
                      Skipped
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden p-6">
                    {detailRows.length ? (
                      <div className="h-full overflow-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-100 text-left">
                              {detailHeaders.map((header) => (
                                <th key={header} className="border-b border-slate-200 px-3 py-2 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detailRows.map((item, rowIndex) => (
                              <tr key={rowIndex} className="odd:bg-white even:bg-slate-50">
                                {detailHeaders.map((header) => (
                                  <td key={`${rowIndex}-${header}`} className="border-b border-slate-200 px-3 py-2">
                                    {String(item[header] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-600">
                        No records available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
