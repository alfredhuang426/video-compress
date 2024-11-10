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

  const convert = async (file: File, settings: ConversionSettings) => {
    try {
      setError(null);
      
      if (!ffmpegRef.current) {
        const loaded = await loadFFmpeg();
        if (!loaded) return;
      }

      setLoading(true);
      const ffmpeg = ffmpegRef.current;
      const { fetchFile } = await import('@ffmpeg/util');
      
      const inputFileName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputFileName = 'output.mp4';
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));

      const scaleFilter = getScaleFilter(settings.resolution);
      
      const command = [
        '-i', inputFileName,
        '-c:v', settings.videoCodec,
        '-c:a', settings.audioCodec,
        '-b:v', settings.videoBitrate,
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

  return {
    convert,
    error,
    loading,
    progress,
    isLoadingFFmpeg
  };
}