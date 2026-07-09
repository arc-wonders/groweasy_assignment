'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

type ChatMessage =
  | {
      id: string;
      role: 'assistant' | 'user';
      type: 'text';
      content: string;
    }
  | {
      id: string;
      role: 'user';
      type: 'csv';
      fileName: string;
      rows: CsvRow[];
      compact: boolean;
    }
  | {
      id: string;
      role: 'assistant';
      type: 'result';
      result: ImportResponse;
    };

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    type: 'text',
    content: 'Upload a CSV from the prompt bar and I will preview it here before import.',
  },
];

const apiBaseUrl = '';

function getHeaders(rows: CsvRow[]) {
  return rows[0] ? Object.keys(rows[0]) : [];
}

function CsvPreview({
  rows,
  fileName,
  compact,
  onOpen,
}: {
  rows: CsvRow[];
  fileName: string;
  compact: boolean;
  onOpen: () => void;
}) {
  const headers = getHeaders(rows);
  const visibleHeaders = headers.slice(0, compact ? 3 : 6);
  const visibleRows = rows.slice(0, compact ? 2 : 8);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full overflow-hidden rounded-xl border border-white/80 bg-white/95 text-left shadow-xl shadow-slate-950/10 ring-1 ring-slate-200/60 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-none dark:ring-zinc-800 dark:hover:border-cyan-400/40 ${
        compact ? 'max-w-md' : 'max-w-3xl'
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-gradient-to-r from-white to-cyan-50/50 px-4 py-3 dark:border-zinc-800 dark:from-zinc-900 dark:to-cyan-950/20">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-100">{fileName}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {rows.length} rows, {headers.length} columns
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          Preview
        </span>
      </div>

      <div className={`${compact ? 'max-h-28' : 'max-h-80'} overflow-hidden`}>
        <table className="min-w-full text-xs">
          <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              {visibleHeaders.map((header) => (
                <th key={header} className="border-b border-zinc-200 px-3 py-2 font-medium dark:border-zinc-800">
                  <span className="line-clamp-1">{header}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-900 dark:even:bg-zinc-950">
                {visibleHeaders.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="border-b border-zinc-100 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                    <span className="line-clamp-1">{String(row[header] ?? '')}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </button>
  );
}

function FullCsvPreview({
  rows,
  fileName,
  onClose,
}: {
  rows: CsvRow[];
  fileName: string;
  onClose: () => void;
}) {
  const headers = getHeaders(rows);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/70 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-gradient-to-r from-white to-cyan-50 px-5 py-4 dark:border-zinc-800 dark:from-zinc-950 dark:to-cyan-950/20">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">{fileName}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {rows.length} rows, {headers.length} columns
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-zinc-100 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="border-b border-zinc-200 px-3 py-2 font-medium dark:border-zinc-800">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                  {headers.map((header) => (
                    <td key={`${rowIndex}-${header}`} className="border-b border-zinc-100 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {String(row[header] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultSummary({
  result,
  onOpenRows,
}: {
  result: ImportResponse;
  onOpenRows: (title: string, rows: CsvRow[]) => void;
}) {
  const summaryCards = [
    {
      label: 'Imported',
      count: result.totalImported,
      rows: result.imported,
      title: 'Imported records',
      className:
        'border-emerald-200/70 bg-emerald-50/80 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:hover:bg-emerald-400/15',
      pillClassName: 'bg-emerald-600 text-white dark:bg-emerald-300 dark:text-emerald-950',
    },
    {
      label: 'Skipped',
      count: result.totalSkipped,
      rows: result.skipped,
      title: 'Skipped records',
      className:
        'border-amber-200/70 bg-amber-50/80 text-amber-900 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15',
      pillClassName: 'bg-amber-600 text-white dark:bg-amber-300 dark:text-amber-950',
    },
  ];

  return (
    <div className="max-w-xl rounded-xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-slate-950/10 ring-1 ring-slate-200/60 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-none dark:ring-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Import complete</div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Select a result group to inspect rows.</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onOpenRows(card.title, card.rows)}
            className={`group rounded-lg border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium opacity-75">{card.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">{card.count}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold opacity-90 transition group-hover:opacity-100 ${card.pillClassName}`}>
                View
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingRows, setParsingRows] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewCsv, setPreviewCsv] = useState<{ fileName: string; rows: CsvRow[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const latestCsv = useMemo(() => {
    return [...messages].reverse().find((message): message is Extract<ChatMessage, { type: 'csv' }> => message.type === 'csv') ?? null;
  }, [messages]);

  const collapseCsvMessages = () => {
    setMessages((current) =>
      current.map((message) => (message.type === 'csv' ? { ...message, compact: true } : message)),
    );
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }

    setError('');
    setIsParsing(true);
    setParsingRows(0);
    setProcessingProgress(0);
    collapseCsvMessages();

    const parsedRows: CsvRow[] = [];
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      step: (result) => {
        parsedRows.push(result.data);
        setParsingRows(parsedRows.length);
      },
      complete: () => {
        const rows = [...parsedRows];
        setIsParsing(false);
        setParsingRows(rows.length);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'user',
            type: 'csv',
            fileName: file.name,
            rows,
            compact: false,
          },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            type: 'text',
            content: 'I parsed the CSV preview. You can open it anytime from the chat, then import when ready.',
          },
        ]);
      },
      error: () => {
        setIsParsing(false);
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

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile =
      event.dataTransfer.files?.[0] ??
      Array.from(event.dataTransfer.items ?? []).find((item) => item.kind === 'file')?.getAsFile();

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setDragActive(false);
  };

  const handleSend = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    collapseCsvMessages();
    setPrompt('');
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'user',
        type: 'text',
        content: trimmedPrompt,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'text',
        content: latestCsv
          ? 'The latest CSV stays attached above as a compact preview. Use Import CSV when you want me to process it.'
          : 'Attach a CSV from the prompt bar and I will show the preview here.',
      },
    ]);
  };

  const handleImport = async () => {
    if (!latestCsv?.rows.length) {
      setError('Please upload a CSV file first.');
      return;
    }

    collapseCsvMessages();
    setLoading(true);
    setError('');
    setProcessingProgress(0);

    const totalBatches = Math.max(1, Math.ceil(latestCsv.rows.length / 50));
    const progressTimer = setInterval(() => {
      setProcessingProgress((current) => Math.min(95, current + Math.max(3, Math.round(85 / totalBatches))));
    }, 500);

    try {
      const response = await fetch(`${apiBaseUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: latestCsv.rows }),
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

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'result',
          result: payload as ImportResponse,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      clearInterval(progressTimer);
      setProcessingProgress(100);
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f8fafc_32%,#eef2f7_100%)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,#172033_0,#09090b_44%,#020617_100%)] dark:text-zinc-50">
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-sky-950/10 bg-slate-950/95 text-slate-100 shadow-2xl shadow-slate-950/20 transition-all duration-300 ease-out md:flex ${
          sidebarOpen ? 'w-80' : 'w-[76px]'
        }`}
      >
        <div className="flex min-w-80 flex-col p-3">
          <div className="flex h-14 items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20">
                G
              </div>
              <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-sm font-semibold">GrowEasy</div>
                <div className="text-xs text-slate-400">AI CSV workspace</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '<' : '>'}
            </button>
          </div>

          <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3 text-left text-sm text-slate-100 shadow-inner shadow-white/5 transition hover:bg-white/[0.1]"
            >
              <span>New chat</span>
              <span className="text-lg leading-none text-cyan-300">+</span>
            </button>

            <div className="mt-6 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chats</div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-left text-sm text-white shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300/15"
            >
              <span className="block font-medium">CSV Import Assistant</span>
              <span className="mt-1 block truncate text-xs text-cyan-100/60">Single local chat</span>
            </button>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs font-medium text-slate-300">Session</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">Chats are local for now. Uploads stay in memory until refresh.</div>
            </div>
          </div>
        </div>
      </aside>

      <section
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className="relative flex min-w-0 flex-1 flex-col"
      >
        {dragActive ? (
          <div className="pointer-events-none absolute inset-4 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400 bg-cyan-50/85 text-cyan-950 shadow-2xl shadow-cyan-950/10 backdrop-blur-md dark:bg-cyan-950/60 dark:text-cyan-50">
            <div className="rounded-xl bg-white/80 px-8 py-6 text-center shadow-xl ring-1 ring-cyan-200 dark:bg-slate-950/80 dark:ring-cyan-400/30">
              <div className="text-lg font-semibold">Drop CSV to upload</div>
              <div className="mt-1 text-sm text-cyan-800/70 dark:text-cyan-100/70">I will add the preview directly into this chat.</div>
            </div>
          </div>
        ) : null}

        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/70 bg-white/75 px-4 shadow-sm shadow-slate-200/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 md:flex"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '<' : '>'}
            </button>
            <div>
              <h1 className="text-sm font-semibold">CSV Import Assistant</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Clean, local chat for CSV review and import</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || !latestCsv}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              {loading ? 'Importing' : 'Import CSV'}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'text' ? (
                  <div
                    className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10 dark:bg-cyan-300 dark:text-slate-950'
                        : 'bg-white/90 text-zinc-800 shadow-lg shadow-slate-200/70 ring-1 ring-white/80 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-100 dark:shadow-none dark:ring-zinc-800'
                    }`}
                  >
                    {message.content}
                  </div>
                ) : null}

                {message.type === 'csv' ? (
                  <CsvPreview
                    rows={message.rows}
                    fileName={message.fileName}
                    compact={message.compact}
                    onOpen={() => setPreviewCsv({ fileName: message.fileName, rows: message.rows })}
                  />
                ) : null}

                {message.type === 'result' ? (
                  <ResultSummary
                    result={message.result}
                    onOpenRows={(fileName, rows) => setPreviewCsv({ fileName, rows })}
                  />
                ) : null}
              </div>
            ))}

            {isParsing ? (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white/90 px-4 py-3 text-sm text-zinc-600 shadow-lg shadow-slate-200/70 ring-1 ring-white/80 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-300 dark:shadow-none dark:ring-zinc-800">
                  Parsing rows: {parsingRows}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                  {error}
                </div>
              </div>
            ) : null}

            {processingProgress > 0 && loading ? (
              <div className="mx-auto w-full max-w-xl overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${processingProgress}%` }} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/70 bg-white/75 px-4 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end gap-2 rounded-xl border border-white/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/10 ring-1 ring-slate-200/70 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:ring-zinc-800">
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-700 transition hover:bg-cyan-100 hover:text-cyan-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-200"
                aria-label="Upload CSV"
                title="Upload CSV"
              >
                +
              </button>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Message GrowEasy or attach a CSV"
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
              CSV uploads stay in this browser session until refresh.
            </p>
          </div>
        </div>
      </section>

      {previewCsv ? (
        <FullCsvPreview rows={previewCsv.rows} fileName={previewCsv.fileName} onClose={() => setPreviewCsv(null)} />
      ) : null}
    </main>
  );
}
