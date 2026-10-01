/**
 * SatQuery AI — API Service
 * Central communication bridge between the React frontend, the Flask backend,
 * and the offline PyTorch neural reasoning specialists & physics verification engine.
 */

// Determine base API URL from Vite environment variable:
// Primary: import.meta.env.VITE_API_URL (e.g. set in .env or Vercel project settings)
// Fallback: import.meta.env.VITE_API_BASE_URL (for backwards compatibility)
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export interface BackendHealth {
  status: string;
  engine: string;
  version: string;
  device: string;
  specialists_ready: string[];
  physics_verifier: string;
  paths?: Record<string, string>;
}

export interface BackendModel {
  id: string;
  name: string;
  badge: string;
  status: string;
  description: string;
  supportedInput: string;
  architecture: string;
  precision: string;
  parameters: string;
  benchmarkMetric: string;
  latencyMs: number;
  taskType: string;
  device?: string;
}

export interface BackendSample {
  id: string;
  name: string;
  label: string;
  modality: string;
  description: string;
  recommendedTask: string;
  size_bytes: number;
  path: string;
  url: string;
  preview_url?: string;
}

export type SatelliteSample = BackendSample;

export interface AnalyzeParams {
  queryText: string;
  imagePath?: string;
  secondaryImagePath?: string;
  file?: File;
  secondaryFile?: File;
  confidenceThreshold?: number;
  enablePhysicsVerification?: boolean;
}

export interface AnalyzeResult {
  success: boolean;
  query_text: string;
  task_type: string;
  summary_text: string;
  statistics: {
    detected_pixel_count: number;
    total_scene_pixels: number;
    coverage_percentage: number;
    area_hectares: number;
    mean_probability: number;
    bounding_boxes: Array<{
      id: string;
      box_2d: [number, number, number, number];
      label: string;
      confidence: number;
      area_hectares: number;
    }>;
  };
  bounding_boxes: Array<{
    id: string;
    box_2d: [number, number, number, number];
    label: string;
    confidence: number;
    area_hectares: number;
  }>;
  audit_trace: {
    trace_id: string;
    timestamp: string;
    specialist_model: string;
    verdict: string;
    execution_time_ms: number;
    preprocessing: string[];
  };
  geojson: Record<string, unknown>;
  artifacts?: {
    mask_image_path?: string;
    heatmap_image_path?: string;
    overlay_image_path?: string;
    geojson_path?: string;
    report_json_path?: string;
    report_markdown_path?: string;
  };
  urls?: {
    mask_url?: string;
    heatmap_url?: string;
    overlay_url?: string;
    geojson_url?: string;
    report_json_url?: string;
    report_markdown_url?: string;
  };
  primary_preview_url?: string;
  secondary_preview_url?: string;
}

export interface ChatResponse {
  reply: string;
  traces: Array<{
    id: string;
    title: string;
    status: 'completed' | 'processing' | 'pending' | 'failed';
    durationMs: number;
    details: string;
  }>;
  groundedStats?: Array<{
    label: string;
    value: string;
    unit?: string;
  }>;
  suggestedAction?: {
    label: string;
    actionType: 'open-workspace' | 'highlight-scar' | 'switch-ndvi' | 'export-geojson';
  };
  urls?: Record<string, string>;
  bounding_boxes?: Array<unknown>;
}

export interface ServerReport {
  id: string;
  title: string;
  query: string;
  date: string;
  task: string;
  confidence: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  answer: string;
  modelsUsed: string[];
  executionTime: string;
  status: string;
  inputSummary: string;
  evidenceVisual?: string;
  tags: string[];
  json_url: string;
  md_url: string;
  area_hectares?: number;
  verdict?: string;
}

export class SatQueryApiService {
  public static getFullUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getApiBaseUrl();
    return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
  }

  /**
   * Health check to detect if SatQuery backend engine is online.
   */
  static async checkHealth(): Promise<BackendHealth | null> {
    try {
      const res = await fetch(this.getFullUrl('/api/health'), {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch all 6 neural specialist models & tools from the master core engine.
   */
  static async getModels(): Promise<BackendModel[]> {
    try {
      const res = await fetch(this.getFullUrl('/api/models'));
      if (!res.ok) return [];
      const data = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  /**
   * Static fallback samples pointing to bundled assets in /samples/ when backend is cold-starting.
   */
  public static readonly FALLBACK_SAMPLES: BackendSample[] = [
    {
      id: 'sentinel2_godavari_pre',
      name: 'sentinel2_godavari_pre.tif',
      label: 'Sentinel-2 Godavari Pre-Flood (MSI 12-Band)',
      modality: 'Sentinel-2 MSI (12 Bands)',
      description: 'Pre-flood optical baseline captured over Godavari river basin with calibrated 12-band MSI surface reflectance.',
      recommendedTask: 'grounding',
      size_bytes: 1574860,
      path: 'data/inputs/samples/sentinel2_godavari_pre.tif',
      url: '/api/inputs/samples/sentinel2_godavari_pre.tif',
      preview_url: '/samples/sentinel2_godavari_pre_preview.png'
    },
    {
      id: 'sentinel2_godavari_post',
      name: 'sentinel2_godavari_post.tif',
      label: 'Sentinel-2 Godavari Post-Flood (MSI 12-Band)',
      modality: 'Sentinel-2 MSI (12 Bands)',
      description: 'Post-flood optical acquisition capturing monsoon inundation and reservoir expansion across Godavari delta.',
      recommendedTask: 'change-analysis',
      size_bytes: 1574860,
      path: 'data/inputs/samples/sentinel2_godavari_post.tif',
      url: '/api/inputs/samples/sentinel2_godavari_post.tif',
      preview_url: '/samples/sentinel2_godavari_post_preview.png'
    },
    {
      id: 'sentinel1_godavari_sar',
      name: 'sentinel1_godavari_sar.tif',
      label: 'Sentinel-1 Godavari SAR C-Band (VV/VH)',
      modality: 'Sentinel-1 C-SAR (Dual-Pol)',
      description: 'Cloud-penetrating radar backscatter capturing active surface water boundaries and structural flood extents.',
      recommendedTask: 'grounding',
      size_bytes: 262726,
      path: 'data/inputs/samples/sentinel1_godavari_sar.tif',
      url: '/api/inputs/samples/sentinel1_godavari_sar.tif',
      preview_url: '/samples/sentinel1_godavari_sar_preview.png'
    },
    {
      id: 't0_preFlood',
      name: 't0_preFlood.tiff',
      label: 'High-Res T0 Pre-Flood Satellite',
      modality: 'High-Res Optical (3 Bands)',
      description: 'Pre-staged high-resolution baseline raster for bi-temporal flood inundation analysis.',
      recommendedTask: 'change-analysis',
      size_bytes: 363074,
      path: 'data/inputs/uploads/t0_preFlood.tiff',
      url: '/api/inputs/uploads/t0_preFlood.tiff',
      preview_url: '/samples/t0_preFlood_preview.png'
    },
    {
      id: 't1_postFlood',
      name: 't1_postFlood.tiff',
      label: 'High-Res T1 Post-Flood Satellite',
      modality: 'High-Res Optical (3 Bands)',
      description: 'Pre-staged high-resolution post-flood acquisition for differential inundation detection.',
      recommendedTask: 'change-analysis',
      size_bytes: 365413,
      path: 'data/inputs/uploads/t1_postFlood.tiff',
      url: '/api/inputs/uploads/t1_postFlood.tiff',
      preview_url: '/samples/t1_postFlood_preview.png'
    }
  ];

  /**
   * Fetch pre-bundled sample datasets with pre-generated previews.
   * Gracefully falls back to bundled static sample metadata if Render is offline or cold-starting.
   */
  static async getSamples(): Promise<BackendSample[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(this.getFullUrl('/api/samples'), {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return this.FALLBACK_SAMPLES;
      const data = await res.json();
      if (!data.samples || data.samples.length === 0) {
        return this.FALLBACK_SAMPLES;
      }
      return data.samples.map((s: BackendSample) => ({
        ...s,
        preview_url: s.preview_url ? this.getFullUrl(s.preview_url) : undefined,
        url: this.getFullUrl(s.url),
      }));
    } catch {
      return this.FALLBACK_SAMPLES;
    }
  }

  /**
   * Fetch all uploaded rasters and datasets in data/inputs/uploads.
   */
  static async getUploads(): Promise<Array<{
    name: string;
    relative_path?: string;
    folder?: string;
    size_bytes: number;
    path: string;
    url: string;
    preview_url?: string;
  }>> {
    try {
      const res = await fetch(this.getFullUrl('/api/uploads'));
      if (!res.ok) return [];
      const data = await res.json();
      return (data.uploads || []).map((u: any) => ({
        ...u,
        preview_url: u.preview_url ? this.getFullUrl(u.preview_url) : undefined,
        url: this.getFullUrl(u.url),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Upload a satellite raster (GeoTIFF / TIFF) directly to the backend.
   */
  static async uploadFile(file: File): Promise<{
    filename: string;
    file_path: string;
    url: string;
    preview_url?: string;
    original_name?: string;
    file_size_bytes?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(this.getFullUrl('/api/upload'), {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error || `Upload failed with HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    const data = await res.json();
    return {
      ...data,
      preview_url: data.preview_url ? this.getFullUrl(data.preview_url) : undefined,
      url: this.getFullUrl(data.url),
    };
  }

  /**
   * Execute an end-to-end analytical query across input rasters with timeout and cold-start retry.
   */
  static async runAnalysis(params: AnalyzeParams): Promise<AnalyzeResult> {
    const formData = new FormData();
    formData.append('query_text', params.queryText);
    formData.append('confidence_threshold', String(params.confidenceThreshold ?? 0.45));
    formData.append('enable_physics_verification', String(params.enablePhysicsVerification ?? true));

    if (params.file) {
      formData.append('file', params.file);
    } else if (params.imagePath) {
      formData.append('image_path', params.imagePath);
    }

    if (params.secondaryFile) {
      formData.append('secondary_file', params.secondaryFile);
    } else if (params.secondaryImagePath) {
      formData.append('secondary_image_path', params.secondaryImagePath);
    }

    const executeFetch = async (): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
      try {
        const response = await fetch(this.getFullUrl('/api/analyze'), {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Analysis timed out after 90 seconds. The satellite image scene may be too large or the server is processing another heavy query.');
        }
        throw err;
      }
    };

    let res = await executeFetch();

    // If Render backend is waking up from sleep (503), retry once after a short delay
    if (res.status === 503) {
      await new Promise(r => setTimeout(r, 4000));
      res = await executeFetch();
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error || `Analysis failed with HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }

    const data = await res.json();

    // Convert relative artifact URLs to absolute URLs
    if (data.urls) {
      Object.keys(data.urls).forEach((k) => {
        if (data.urls[k]) {
          data.urls[k] = this.getFullUrl(data.urls[k]);
        }
      });
    }
    if (data.primary_preview_url) {
      data.primary_preview_url = this.getFullUrl(data.primary_preview_url);
    }
    if (data.secondary_preview_url) {
      data.secondary_preview_url = this.getFullUrl(data.secondary_preview_url);
    }

    return data;
  }

  /**
   * Send chat prompt to Orbit Earth Observation AI Copilot.
   */
  static async sendChat(message: string, aoi?: string): Promise<ChatResponse | null> {
    try {
      const res = await fetch(this.getFullUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, aoi }),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch all saved analytical reports from the backend outputs.
   */
  static async getReports(): Promise<ServerReport[]> {
    try {
      const res = await fetch(this.getFullUrl('/api/reports'));
      if (!res.ok) return [];
      const data = await res.json();
      return (data.reports || []).map((rep: ServerReport) => ({
        ...rep,
        evidenceVisual: rep.evidenceVisual ? this.getFullUrl(rep.evidenceVisual) : undefined,
        json_url: this.getFullUrl(rep.json_url),
        md_url: this.getFullUrl(rep.md_url),
      }));
    } catch {
      return [];
    }
  }
}