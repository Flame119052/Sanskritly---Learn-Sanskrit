import React, { useState } from 'react';
import { analyzeSyllabus } from '../services/geminiService';
import { Section } from '../types';
import { XMarkIcon, SparklesIcon, ArrowUpTrayIcon, ArrowPathIcon, TrashIcon } from './Icons';

interface SyllabusModalProps {
  onClose: () => void;
  onSyllabusUpdate: (newSections: Section[]) => void;
  onRevertToDefault: () => void;
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const SyllabusModal: React.FC<SyllabusModalProps> = ({ onClose, onSyllabusUpdate, onRevertToDefault }) => {
  // FIX: Updated state to handle multiple file uploads.
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // FIX: Updated file handling to support multiple files with validation for count and size.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    if (!selectedFiles.length) return;

    // Reset input so the same file can be re-added if removed
    event.target.value = ''; 
    setError(null);

    const newFiles = [...files, ...selectedFiles];

    if (newFiles.length > MAX_FILES) {
        setError(`You can upload a maximum of ${MAX_FILES} files.`);
        return;
    }

    for (const file of selectedFiles) {
        if (file.size > MAX_SIZE_BYTES) {
            setError(`File "${file.name}" is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return;
        }
    }

    setFiles(newFiles);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Please upload at least one syllabus file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const filePromises = files.map(file => {
            return new Promise<{ content: string, mimeType: string, name: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        content: e.target?.result as string,
                        mimeType: file.type || 'application/octet-stream',
                        name: file.name,
                    });
                };
                reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));

                if (file.type.startsWith('text/') || !file.type) {
                    reader.readAsText(file);
                } else {
                    reader.readAsDataURL(file);
                }
            });
        });

        const fileData = await Promise.all(filePromises);
        const newSections = await analyzeSyllabus(fileData);

        if (newSections.length === 0) {
            throw new Error("The AI couldn't find any syllabus sections in the document(s). Please try different files or formats.");
        }
        onSyllabusUpdate(newSections);
        onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">AI Syllabus Builder</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 space-y-6">
          <div>
            <p className="text-slate-300 mb-4 text-sm">
              Upload up to 5 syllabus files. Lex will analyze them to structure the app. (Max 50MB per file)
            </p>
            
            {/* File list */}
            <div className="space-y-2 mb-4">
                {files.map((file, index) => (
                    <div key={index} className="bg-slate-800/50 p-2 rounded-lg flex items-center justify-between animate-fade-in border border-slate-700">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-slate-200 truncate">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white flex-shrink-0 ml-2">
                           <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
            </div>

            <label className={`w-full cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-500 hover:bg-slate-800/50 rounded-lg p-6 flex flex-col items-center justify-center text-center text-slate-400 hover:text-cyan-400 transition-colors ${files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ArrowUpTrayIcon className="w-10 h-10 mb-2" />
              <span className="font-semibold">{files.length > 0 ? 'Add more files' : 'Click to upload syllabus files'}</span>
              <span className="text-xs">{`(${files.length}/${MAX_FILES} uploaded) .pdf, .docx, .pptx, .txt`}</span>
              <input 
                type="file" 
                multiple
                className="hidden" 
                accept=".txt,.md,.pdf,.docx,.pptx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange} 
                disabled={files.length >= MAX_FILES}
              />
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || files.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <SparklesIcon className="w-5 h-5 animate-pulse" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Analyze & Update App</span>
                </>
              )}
            </button>
            <button
                onClick={onRevertToDefault}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 font-bold py-3 px-4 rounded-lg"
            >
                <ArrowPathIcon className="w-5 h-5"/>
                <span>Revert to Default</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};