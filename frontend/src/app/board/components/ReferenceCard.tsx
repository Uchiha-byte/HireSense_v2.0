'use client';

import { Button } from '@/components/ui/button';
import { Reference } from './ReferenceManager';

interface ReferenceCardProps {
  reference: Reference;
  isOpen: boolean;
  onToggle: () => void;
  // These props are deprecated for zoom, but kept for compatibility
  onCall: (reference: Reference) => Promise<void>;
  onViewTranscript: (reference: Reference) => void;
  callInProgress: boolean;
}

export default function ReferenceCard({
  reference,
  isOpen,
  onToggle,
  onCall,
  onViewTranscript,
  callInProgress
}: ReferenceCardProps) {
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'scheduled': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Scheduled</span>;
      case 'started': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium animate-pulse">Meeting Live</span>;
      case 'ended': return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Ended</span>;
      case 'recording_uploaded': return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">Analyzing Audio...</span>;
      case 'transcribed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">Analysis Complete</span>;
      case 'failed': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Failed</span>;
      case 'idle':
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Added</span>;
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl">
      <button
        className="w-full flex justify-between items-center px-6 py-4 bg-slate-50 rounded-t-xl focus:outline-none"
        onClick={onToggle}
      >
        <span className="font-semibold text-gray-800">{reference.name}</span>
        <div className="flex gap-4 items-center">
            {getStatusBadge(reference.callStatus)}
            {reference.meetingDate && (
              <span className="text-gray-500 text-xs ml-2 hidden md:inline-block">
                {new Date(reference.meetingDate).toLocaleString()} ({reference.durationMinutes}m)
              </span>
            )}
            <span className="ml-2 text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-4">
          <div className="mb-2 text-sm text-gray-600">
            {reference.companyName}
            {reference.roleTitle && ` | ${reference.roleTitle}`}
            {reference.workDuration && ` | ${reference.workDuration}`}
          </div>
          <div className="mb-3 text-xs text-gray-400">Added: {reference.dateAdded}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {reference.meetingLink && (
              <div className="flex flex-col gap-1 text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <span className="text-slate-500 font-medium">Zoom Meeting</span>
                <a
                  href={reference.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            )}

            {reference.codingInterviewUrl && (
              <div className="flex flex-col gap-1 text-sm bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                <span className="text-slate-500 font-medium">Coding Interface</span>
                <a
                  href={reference.codingInterviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 font-semibold hover:underline"
                >
                  Launch Judge0
                </a>
              </div>
            )}
          </div>

          {reference.callStatus === 'transcribed' && reference.summary && (
            <div className="bg-white border border-emerald-200 rounded-lg p-4 text-gray-700 text-sm mt-2 shadow-sm">
              <h4 className="font-bold text-emerald-700 mb-2 border-b border-emerald-100 pb-2">AI Call Summary</h4>
              <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{reference.summary}</p>
            </div>
          )}

          {reference.callStatus === 'transcribed' && reference.transcript?.text && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-gray-600 text-xs mt-4 shadow-sm max-h-40 overflow-y-auto w-full">
                <h4 className="font-bold text-slate-500 mb-2">Full Transcript</h4>
                <p className="whitespace-pre-wrap">{reference.transcript.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}