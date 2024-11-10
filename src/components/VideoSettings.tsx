import React from 'react';
import type { ConversionSettings } from '../types';

interface VideoSettingsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
}

export default function VideoSettings({ settings, onSettingsChange }: VideoSettingsProps) {
  const handleSettingChange = (key: keyof ConversionSettings, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-xl">
      <h2 className="text-lg font-semibold mb-4">Conversion Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Video Codec</label>
          <select
            value={settings.videoCodec}
            onChange={(e) => handleSettingChange('videoCodec', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="libx264">H.264</option>
            <option value="libx265">H.265</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Audio Codec</label>
          <select
            value={settings.audioCodec}
            onChange={(e) => handleSettingChange('audioCodec', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="aac">AAC</option>
            <option value="mp3">MP3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Video Bitrate</label>
          <select
            value={settings.videoBitrate}
            onChange={(e) => handleSettingChange('videoBitrate', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="1000k">1 Mbps</option>
            <option value="2500k">2.5 Mbps</option>
            <option value="5000k">5 Mbps</option>
            <option value="8000k">8 Mbps</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Audio Bitrate</label>
          <select
            value={settings.audioBitrate}
            onChange={(e) => handleSettingChange('audioBitrate', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="96k">96 kbps</option>
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Frame Rate</label>
          <select
            value={settings.frameRate}
            onChange={(e) => handleSettingChange('frameRate', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="24">24 fps</option>
            <option value="30">30 fps</option>
            <option value="60">60 fps</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Resolution</label>
          <select
            value={settings.resolution}
            onChange={(e) => handleSettingChange('resolution', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="1920x1080">1080p</option>
            <option value="1280x720">720p</option>
            <option value="854x480">480p</option>
          </select>
        </div>
      </div>
    </div>
  );
}