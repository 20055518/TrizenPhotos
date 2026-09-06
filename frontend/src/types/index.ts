export type UserRole = 'ADMIN' | 'TEAM_MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface TeamMemberInfo {
  id: string;
  name: string;
  email: string;
}

export interface GallerySummary {
  id: string;
  slug: string;
  is_published: boolean;
  published_at?: string;
  share_url: string;
}

export interface EventItem {
  id: string;
  name: string;
  date?: string;
  location?: string;
  description?: string;
  created_by: string;
  assigned_team_ids: string[];
  assigned_team_members: TeamMemberInfo[];
  total_photos: number;
  selected_photos: number;
  gallery?: GallerySummary | null;
  created_at: string;
}

export interface PhotoItem {
  id: string;
  event_id: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  filename: string;
  original_name: string;
  url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
  is_selected_for_gallery: boolean;
  created_at: string;
}

export interface PublicGalleryInfo {
  slug: string;
  event_name: string;
  event_date?: string;
  event_location?: string;
  event_description?: string;
  total_photos: number;
  requires_pin: boolean;
}

export interface GalleryAccessData {
  gallery_token: string;
  slug: string;
  event_name: string;
  event_date?: string;
  event_location?: string;
  photos: PhotoItem[];
}
