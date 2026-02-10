'use client';

import { useState } from 'react';

interface Review {
  id: string;
  reviewerName: string | null;
  rating: number;
  comment: string | null;
  businessName?: string;
}

interface AIResponses {
  [tone: string]: string;
}

interface AIResponseGeneratorProps {
  review: Review;
  businessName: string;
  onSelectResponse?: (response: string) => void;
}

export default function AIResponseGenerator({
  review,
  businessName,
  onSelectResponse,
}: AIResponseGeneratorProps) {
  const [responses, setResponses] = useState<AIResponses | null>(null);
  const [tones, setTones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generateResponses = async () => {
    setLoading(true);
    setError(null);
    setResponses(null);
    setSelectedTone(null);

    try {
      const res = await fetch('/api/ai/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: review.reviewerName,
          rating: review.rating,
          comment: review.comment,
          businessName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate responses');
      }

      const data = await res.json();
      setResponses(data.responses);
      setTones(data.tones || Object.keys(data.responses));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResponse = (tone: string, newText: string) => {
    if (!responses) return;
    setResponses({ ...responses, [tone]: newText });
  };

  const handleCopy = async (tone: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(tone);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = (tone: string, text: string) => {
    setSelectedTone(tone);
    onSelectResponse?.(text);
  };

  const toneLabels: Record<string, { label: string; emoji: string; color: string }> = {
    professional: { label: 'Professional', emoji: '👔', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    friendly: { label: 'Friendly', emoji: '😊', color: 'bg-green-50 border-green-200 text-green-800' },
    apologetic: { label: 'Apologetic', emoji: '🤝', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    enthusiastic: { label: 'Enthusiastic', emoji: '🎉', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  };

  return (
    <div className="mt-3">
      {/* Generate Button */}
      {!responses && !loading && (
        <button
          onClick={generateResponses}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate AI Response
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating responses...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={generateResponses}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Response Options */}
      {responses && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              AI-Generated Responses — click to edit
            </span>
            <button
              onClick={generateResponses}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>

          {tones.map((tone) => {
            const meta = toneLabels[tone] || { label: tone, emoji: '💬', color: 'bg-gray-50 border-gray-200 text-gray-800' };
            const text = responses[tone];
            if (!text) return null;

            return (
              <div
                key={tone}
                className={`border rounded-lg p-4 transition-all ${
                  selectedTone === tone
                    ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Tone Label */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  {selectedTone === tone && (
                    <span className="text-xs text-indigo-600 font-medium">✓ Selected</span>
                  )}
                </div>

                {/* Editable Response Text */}
                <textarea
                  value={text}
                  onChange={(e) => handleEditResponse(tone, e.target.value)}
                  className="w-full text-sm text-gray-700 leading-relaxed mb-3 p-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300"
                  rows={4}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(tone, text)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedTone === tone
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {selectedTone === tone ? 'Selected' : 'Use This'}
                  </button>
                  <button
                    onClick={() => handleCopy(tone, text)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {copied === tone ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
