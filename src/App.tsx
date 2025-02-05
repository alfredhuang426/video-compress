import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { FileVideo, Upload, X } from 'lucide-react';

const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [isReady, setIsReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load FFmpeg
  React.useEffect(() => {
    load();
  }, []);

  const load = async () => {
    await ffmpeg.load();
    setIsReady(true);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': []
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setVideo(acceptedFiles[0]);
    }
  });

  const compressVideo = async () => {
    if (!video) return;

    setIsProcessing(true);
    setProgress(0);

    // Write the file to memory
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(video));

    // Run the FFmpeg command
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '128k',
      'output.mp4'
    );

    // Read the result
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    setOutputUrl(url);
    setIsProcessing(false);
    setProgress(100);

    // Clean up
    ffmpeg.FS('unlink', 'input.mp4');
    ffmpeg.FS('unlink', 'output.mp4');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading video compressor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Video Compressor</h1>
          <p className="text-gray-600 mb-6">
            Compress your videos right in the browser. No upload needed - everything happens on your device.
          </p>

          {!video ? (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Drag and drop a video file here, or click to select</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileVideo className="w-6 h-6 mr-2" />
                  <span className="font-medium">{video.name}</span>
                </div>
                <button 
                  onClick={() => setVideo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isProcessing && !outputUrl && (
                <Button 
                  onClick={compressVideo}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Compress Video
                </Button>
              )}

              {isProcessing && (
                <div>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-center text-sm text-gray-600">Compressing video...</p>
                </div>
              )}

              {outputUrl && (
                <div className="mt-4">
                  <video 
                    src={outputUrl} 
                    controls 
                    className="w-full rounded-lg"
                  />
                  <a
                    href={outputUrl}
                    download="compressed-video.mp4"
                    className="mt-4 inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Download Compressed Video
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;