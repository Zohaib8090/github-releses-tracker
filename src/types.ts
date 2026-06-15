export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
  assets: GitHubAsset[];
}

export interface TrackedRepository {
  owner: string;
  repo: string;
  addedAt: string;
  lastFetchedAt?: string;
  releasesCount?: number;
  totalDownloads?: number;
}

export interface ReleaseSnapshot {
  timestamp: string;
  releases: {
    tag_name: string;
    total_downloads: number;
    assets: {
      name: string;
      download_count: number;
    }[];
  }[];
}

export interface RepositoryHistory {
  owner: string;
  repo: string;
  snapshots: ReleaseSnapshot[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}
