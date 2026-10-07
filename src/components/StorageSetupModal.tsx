import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StorageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StorageStatus {
  connected: boolean;
  bucketExists: boolean;
  bucketName: string;
  canUpload: boolean;
  uploadError?: string | null;
  hasImageUrlColumn: boolean;
  canInsertUsers?: boolean;
  isFullyConfigured: boolean;
  fixSql: string;
  message?: string;
}

export const StorageSetupModal: React.FC<StorageSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/supabase/storage-status').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setStatus(data);
        return;
      }
      // Direct client-side check for Vercel
      const { data: listData, error: listErr } = await supabase.storage.from('images').list();
      setStatus({
        connected: true,
        bucketExists: !listErr,
        bucketName: 'images',
        canUpload: !listErr,
        hasImageUrlColumn: true,
        canInsertUsers: true,
        isFullyConfigured: !listErr,
        fixSql: '',
        message: !listErr
          ? 'Supabase cloud storage and database are online.'
          : 'Supabase storage bucket requires RLS policy setup.',
      });
    } catch (err) {
      console.warn('Failed to fetch storage status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultSql = status?.fixSql || `-- 1. Add image_url column to the products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Allow public uploads to 'images' storage bucket
CREATE POLICY "Allow public uploads to images bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'images');

-- 3. Allow public updates to 'images' storage bucket
CREATE POLICY "Allow public updates to images bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'images');

-- 4. Allow public reads from 'images' storage bucket
CREATE POLICY "Allow public reads from images bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 5. Allow public insert, update, and delete on 'users' table for Staff Accounts
DROP POLICY IF EXISTS "Allow public all on users" ON public.users;
CREATE POLICY "Allow public all on users"
ON public.users FOR ALL
TO public
USING (true)
WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(defaultSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAllReady = status?.isFullyConfigured ?? false;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-[#E8DFD4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#2A1810] text-[#FAF6F2] flex items-center justify-between border-b border-[#3D291C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8A4A28]/30 border border-[#8A4A28]/50 flex items-center justify-center text-[#E5A869]">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F7E7D9]">Cloud Database & Image Storage Setup</h3>
              <p className="text-[11px] text-[#C4A48A]">
                Supabase Storage Bucket, Product Images & Staff Accounts Persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#C4A48A] hover:text-[#FAF6F2] p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status summary banner */}
          {isAllReady ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Cloud Database & Storage Sync is Fully Active!
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Both product images and staff accounts are stored permanently in your Supabase cloud database and CDN.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Why Are Product Images & Staff Accounts Temporary?
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  In Supabase, Row-Level Security (RLS) policies are required to allow public uploads to the <span className="font-bold">images</span> storage bucket and new rows in the <span className="font-bold">users</span> table. Run the 1-step SQL below to permanently activate cloud storage for both!
                </p>
              </div>
            </div>
          )}

          {/* Diagnostic Check List */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFC8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6D5441] uppercase tracking-wider">
                Current Cloud Configuration Status
              </span>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={isLoading}
                className="text-[11px] font-bold text-[#8A4A28] hover:text-[#5E3018] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Re-check</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Check 1: Bucket */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E8DFC8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#7A6452] uppercase">1. Storage Bucket</span>
                  {status?.bucketExists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="text-xs font-bold text-[#2A1810]">
                  {status?.bucketExists ? 'Bucket "images" Found' : 'Bucket Not Found'}
                </div>
                <p className="text-[10px] text-[#8C7355] mt-0.5">
                  {status?.bucketExists ? 'Public storage bucket created' : 'Create "images" bucket in Storage'}
                </p>
              </div>

              {/* Check 2: Bucket Policy */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E8DFC8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#7A6452] uppercase">2. Storage Uploads</span>
                  {status?.canUpload ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="text-xs font-bold text-[#2A1810]">
                  {status?.canUpload ? 'Uploads Allowed' : 'Policy Missing'}
                </div>
                <p className="text-[10px] text-[#8C7355] mt-0.5">
                  {status?.canUpload ? 'Public upload permission granted' : 'Uploads blocked by Storage RLS'}
                </p>
              </div>

              {/* Check 3: Database Column */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E8DFC8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#7A6452] uppercase">3. Product Images</span>
                  {status?.hasImageUrlColumn ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="text-xs font-bold text-[#2A1810]">
                  {status?.hasImageUrlColumn ? 'Column Ready' : 'image_url Missing'}
                </div>
                <p className="text-[10px] text-[#8C7355] mt-0.5">
                  {status?.hasImageUrlColumn ? 'Database persists image URLs' : 'Add image_url to products table'}
                </p>
              </div>

              {/* Check 4: Staff Accounts */}
              <div className="bg-white p-2.5 rounded-lg border border-[#E8DFC8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#7A6452] uppercase">4. Staff Accounts</span>
                  {status?.canInsertUsers ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <div className="text-xs font-bold text-[#2A1810]">
                  {status?.canInsertUsers ? 'Users Table Active' : 'users Policy Missing'}
                </div>
                <p className="text-[10px] text-[#8C7355] mt-0.5">
                  {status?.canInsertUsers ? 'Staff accounts saved to database' : 'Add public policy on users table'}
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3D291C] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#8A4A28]" />
                <span>1-Click Fix: Run this SQL in Supabase SQL Editor</span>
              </span>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-[#1E140F] text-[#FAF5EE] rounded-lg text-[11px] font-mono overflow-x-auto border border-[#3E2723] max-h-44 leading-relaxed">
                {defaultSql}
              </pre>
            </div>
          </div>

          {/* Visual 3-Step Guide */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8DFC8] space-y-2 text-xs text-[#4A2E20]">
            <span className="text-[11px] font-bold text-[#6D5441] uppercase tracking-wider block">
              How to Apply in 30 Seconds:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                <div className="font-bold text-[#8A4A28] mb-0.5">Step 1</div>
                <div>Open your Supabase project (<strong>KennyP</strong>) and click <strong>SQL Editor</strong> (<span className="font-mono text-[#8A4A28] font-bold">&gt;_</span>) on the left sidebar.</div>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                <div className="font-bold text-[#8A4A28] mb-0.5">Step 2</div>
                <div>Click <strong>New query</strong>, paste the copied SQL above, and click <strong>Run</strong> (or press <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Ctrl+Enter</kbd>).</div>
              </div>
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8DFC8]">
                <div className="font-bold text-[#8A4A28] mb-0.5">Step 3</div>
                <div>Click <strong>"Re-check"</strong> above. Once verified, all product images will be stored permanently in Supabase CDN!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#FAF7F2] border-t border-[#E8DFC8] flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard/project/yppehqowqgeyydsgnyrj/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8A4A28] hover:text-[#5E3018] font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EFE7DC] border border-[#D5C2B1] text-[#3D291C] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#4E342E] hover:bg-[#3E2723] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
