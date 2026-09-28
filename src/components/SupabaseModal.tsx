import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
  schemaSql: string;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  schemaSql,
}) => {
  const initialConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(initialConfig.url);
  const [anonKey, setAnonKey] = useState(initialConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'schema'>('config');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      saveSupabaseConfig(url, anonKey);
      onConfigChanged();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg max-w-2xl w-full border border-[#E8DFD4] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#321B13] text-[#FAF6F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#E5A869]" />
            <div>
              <h3 className="font-bold text-sm">Supabase Database Integration</h3>
              <p className="text-[11px] text-[#C4A48A]">
                PostgreSQL cloud database configuration & schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#C4A48A] hover:text-[#FAF6F2] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-[#E8DFD4] px-4 pt-2 bg-[#FAF7F2] gap-3">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#8A4A28] text-[#8A4A28]'
                : 'border-transparent text-[#7A6452] hover:text-[#2A1810]'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-[#8A4A28] text-[#8A4A28]'
                : 'border-transparent text-[#7A6452] hover:text-[#2A1810]'
            }`}
          >
            <span>PostgreSQL Schema (SQL)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto text-xs space-y-4">
          {activeTab === 'config' ? (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="bg-[#FAF7F2] p-3.5 rounded border border-[#E8DFC8] space-y-1.5 leading-relaxed text-[#5C4A3A]">
                <p className="font-bold text-[#2A1810]">
                  How Supabase works in KENNY Brew Intelligence:
                </p>
                <p>
                  1. The application runs natively with instant zero-latency persistent local storage.
                </p>
                <p>
                  2. To sync with your remote Supabase cloud project, paste your <strong>Project URL</strong> and <strong>Anon Public Key</strong> below and click <em>Test & Connect</em>.
                </p>
              </div>

              <div>
                <label className="font-bold text-[#2A1810] block mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded text-xs font-mono focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
                />
              </div>

              <div>
                <label className="font-bold text-[#2A1810] block mb-1">
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-white border border-[#E8DFC8] rounded text-xs font-mono focus:outline-none focus:border-[#8A4A28] text-[#2A1810]"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded border flex items-start gap-2 text-xs ${
                    testResult.success
                      ? 'bg-[#EAF5EC] border-[#C5E5CB] text-[#1E7036]'
                      : 'bg-[#FFF8F6] border-[#F5C2C2] text-[#991B1B]'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                    saveSupabaseConfig('', '');
                    setTestResult({ success: true, message: 'Switched to Local Persistent Storage.' });
                    onConfigChanged();
                  }}
                  className="text-xs text-[#8C7355] hover:underline cursor-pointer"
                >
                  Reset to Local Storage
                </button>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2.5 bg-[#8A4A28] hover:bg-[#733C1E] text-white text-xs font-bold rounded cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test & Save Supabase'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7A6452]">
                  Run this SQL in your Supabase SQL Editor to initialize all 8 tables and sample seed data.
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1 bg-[#FAF7F2] hover:bg-[#EFE9DF] text-[#4A2E20] border border-[#E8DFC8] rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#1E7036]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#2A1810] text-[#FAF3EB] rounded font-mono text-[11px] overflow-x-auto max-h-[50vh] leading-relaxed">
                {schemaSql}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
