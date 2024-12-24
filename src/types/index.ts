export interface ConversionSettings {
  videoCodec: string;
  audioCodec: string;
  videoBitrate: string;
  audioBitrate: string;
  frameRate: string;
  resolution: string;
  compressionMethod: 'bitrate' | 'percentage' | 'filesize' | 'crf';
  targetPercentage?: string;
  targetFilesize?: string;
  crfValue?: string;
}