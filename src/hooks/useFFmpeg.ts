import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { ConversionSettings } from '../types';

export function useFFmpeg() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);
  const ffmpegRef = useRef<any>(null);
  const ffmpegLoadPromise = useRef<Promise<boolean> | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoadPromise.current) {
      return ffmpegLoadPromise.current;
    }

    ffmpegLoadPromise.current = (async () => {
      try {
        setIsLoadingFFmpeg(true);
        setError(null);

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        const ffmpeg = new FFmpeg();
        
        ffmpeg.on('progress', ({ progress }) => {
          setProgress(Math.round(progress * 100));
        });

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        ffmpegRef.current = ffmpeg;
        return true;
      } catch (err) {
        console.error('FFmpeg loading error:', err);
        setError('Failed to load FFmpeg. Please try again.');
        return false;
      } finally {
        setIsLoadingFFmpeg(false);
      }
    })();

    return ffmpegLoadPromise.current;
  }, []);

  const getScaleFilter = (resolution: string) => {
    const [width] = resolution.split('x');
    // Force divisible by 2 for compatibility, maintain aspect ratio
    return `scale='min(${width},iw)':'-2'`;
  };

  const getCompressionArgs = (settings: ConversionSettings): string[] => {
    switch (settings.compressionMethod) {
      case 'percentage': {
        // For percentage, we'll use CRF with a scaled quality value
        // 100% = CRF 18 (best), 1% = CRF 51 (worst)
        const percentage = parseFloat(settings.targetPercentage || '100');
        const crf = Math.round(51 - ((percentage / 100) * (51 - 18)));
        return ['-qp', crf.toString()];
      }
      case 'filesize': {
        // For filesize target, we'll also use CRF with a moderate value
        // and rely on the two-pass encoding
        const targetSize = parseFloat(settings.targetFilesize || '100');
        // Larger target = lower CRF (better quality)
        const crf = Math.max(18, Math.min(51, Math.round(51 - (Math.log(targetSize) / Math.log(10240)) * (51 - 18))));
        return ['-qp', crf.toString()];
      }
      case 'crf':
        // FFmpeg.wasm uses -qp instead of -crf
        return ['-qp', settings.crfValue || '23'];
      case 'bitrate':
      default:
        return ['-b:v', settings.videoBitrate];
    }
  };

  const convert = async (file: File, settings: ConversionSettings) => {
    try {
      setError(null);
      
      if (!ffmpegRef.current) {
        const loaded = await loadFFmpeg();
        if (!loaded) return;
      }

      setLoading(true);
      setFileSizes({ original: file.size, converted: null });
      const ffmpeg = ffmpegRef.current;
      const { fetchFile } = await import('@ffmpeg/util');
      
      const inputFileName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputFileName = 'output.mp4';
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));

      const scaleFilter = getScaleFilter(settings.resolution);
      const compressionArgs = getCompressionArgs(settings);
      
      const command = [
        '-i', inputFileName,
        '-c:v', settings.videoCodec,
        '-c:a', settings.audioCodec,
        ...compressionArgs,
        '-b:a', settings.audioBitrate,
        '-r', settings.frameRate,
        '-vf', scaleFilter,
        '-preset', 'medium',
        '-f', 'mp4',
        '-movflags', '+faststart',
        outputFileName
      ];

      await ffmpeg.exec(command);
      
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: 'video/mp4' });
      setFileSizes(prev => ({ ...prev, converted: blob.size }));
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, '') + '_converted.mp4';
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const [fileSizes, setFileSizes] = useState<{ original: number; converted: number | null }>({
    original: 0,
    converted: null
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return {
    convert,
    error,
    loading,
    progress,
    isLoadingFFmpeg,
    fileSizes,
    formatFileSize
  };
}