const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ProcessingResult {
  job_id: string;
  original_audio_url: string;
  processed_audio_url: string;
  waveform_original_url: string;
  waveform_processed_url: string;
  spectrogram_original_url: string;
  spectrogram_processed_url: string;
  emotion: string;
  confidence: number;
  all_emotions: Record<string, number>;
  processing_time_ms: number;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ProcessingResult;
  error?: string;
}

export async function processAudio(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await fetch(`${API_URL}/api/process-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Processing failed' }));
    throw new Error(error.message || `Server error: ${response.status}`);
  }

  const data = await response.json();

  // Prefix URLs with API base if they're relative
  const prefixUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return {
    ...data,
    original_audio_url: prefixUrl(data.original_audio_url),
    processed_audio_url: prefixUrl(data.processed_audio_url),
    waveform_original_url: prefixUrl(data.waveform_original_url),
    waveform_processed_url: prefixUrl(data.waveform_processed_url),
    spectrogram_original_url: prefixUrl(data.spectrogram_original_url),
    spectrogram_processed_url: prefixUrl(data.spectrogram_processed_url),
  };
}

export async function checkJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_URL}/api/status/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to check job status');
  }
  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export function getEmotionEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    neutral: '😐',
    crying: '😭',
    surprise: '😲',
    disgust: '🤢',
  };
  return emojiMap[emotion.toLowerCase()] || '🎭';
}

export function getEmotionColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    happy: '#4CCD89',
    sad: '#5B9BD5',
    angry: '#E74C5E',
    fear: '#9B59B6',
    neutral: '#C8A96A',
    crying: '#3498DB',
    surprise: '#F5A623',
    disgust: '#27AE60',
  };
  return colorMap[emotion.toLowerCase()] || '#C8A96A';
}
