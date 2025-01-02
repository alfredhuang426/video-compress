import React, { useState } from 'react';
import { Video } from 'lucide-react';
import VideoUploader from './VideoUploader';
import VideoSettings from './VideoSettings';
import { useFFmpeg } from '../hooks/useFFmpeg';
import type { ConversionSettings } from '../types';

const defaultSettings: ConversionSettings = {
  videoCodec: 'libx264',
  audioCodec: 'aac',
  videoBitrate: '2500k',
  audioBitrate: '128k',
  frameRate: '30',
  resolution: '1280x720',
  compressionMethod: 'bitrate'
};

export default function VideoConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    convert,
    error,
    loading,
    progress,
    isLoadingFFmpeg,
    fileSizes,
    formatFileSize
  } = useFFmpeg();

  const handleConvert = async () => {
    if (!file) return;
    await convert(file, settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Video className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Video Converter</h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Settings
          </button>
        </div>

        {showSettings && (
          <VideoSettings
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}

        <div className="space-y-6">
          <VideoUploader
            file={file}
            onFileChange={setFile}
            error={error}
            loading={loading}
            progress={progress}
            isLoadingFFmpeg={isLoadingFFmpeg}
          />

          {fileSizes.converted !== null && (
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>Original size: {formatFileSize(fileSizes.original)}</span>
                <span>Converted size: {formatFileSize(fileSizes.converted)}</span>
              </div>
              <div className={`font-medium ${
                fileSizes.converted < fileSizes.original ? 'text-green-600' : 'text-red-600'
              }`}>
                {fileSizes.converted < fileSizes.original ? 'Saved: ' : 'Increased: '}
                {formatFileSize(Math.abs(fileSizes.converted - fileSizes.original))}
                ({Math.abs(Math.round((1 - fileSizes.converted / fileSizes.original) * 100))}%)
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!file || loading || isLoadingFFmpeg}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              !file || loading || isLoadingFFmpeg
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoadingFFmpeg ? 'Loading FFmpeg...' : loading ? 'Compressing...' : 'Compress'}
          </button>
        </div>
      </div>
    </div>
  );
}