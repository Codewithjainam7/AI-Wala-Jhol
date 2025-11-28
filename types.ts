export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ScanMode = 'text' | 'file' | 'image' | 'video';

export interface FileInfo {
  name: string | null;
  type: string | null;
  size_bytes: number | null;
  pages: number | null;
}

export interface DetectionResult {
  is_ai_generated: boolean;
  ai_probability: number;
  human_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  signals: string[];
  model_suspected: string | null;
  detailed_analysis: string;
}

export interface HumanizerResult {
  requested: boolean;
  humanized_text: string | null;
  changes_made: string[];
  improvement_score: number;
  notes: string | null;
}

export interface UIHints {
  show_loading_animation: boolean;
  suggested_color: 'red' | 'yellow' | 'green';
  suggested_view: 'card' | 'table' | 'graph';
  alert_level: 'info' | 'warning' | 'danger' | 'success';
}

export interface ScanMetadata {
  processing_time_ms: number;
  apis_used: string[];
  version: string;
}

export interface ScanResponse {
  scan_id: string;
  timestamp: string;
  mode: ScanMode;
  file_info: FileInfo;
  detection: DetectionResult;
  humanizer: HumanizerResult;
  recommendations: string[];
  ui_hints: UIHints;
  metadata: ScanMetadata;
  error?: boolean;
  message?: string;
}

export interface ComparisonData {
  chart_data: {
    labels: string[];
    risk_scores: number[];
    ai_probabilities: number[];
  }
}