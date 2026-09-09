import axios from 'axios';

import {
  User,
  EventItem,
  PhotoItem,
  PublicGalleryInfo,
  GalleryAccessData,
  GallerySummary
} from '../types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/gallery/')
    ) {
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{
      access_token: string;
      user: User;
    }>('/auth/login', {
      email,
      password,
    });

    return res.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const res = await api.post<{
      access_token: string;
      user: User;
    }>('/auth/register', data);

    return res.data;
  },

  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  getTeamMembers: async () => {
    const res = await api.get<User[]>('/auth/team-members');
    return res.data;
  },
};

export const eventsApi = {
  list: async () => {
    const res = await api.get<EventItem[]>('/events');
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<EventItem>(`/events/${id}`);
    return res.data;
  },

  create: async (data: {
    name: string;
    date?: string;
    location?: string;
    description?: string;
    assigned_team_ids?: string[];
  }) => {
    const res = await api.post<EventItem>('/events', data);
    return res.data;
  },

  update: async (id: string, data: Partial<EventItem>) => {
    const res = await api.put<EventItem>(`/events/${id}`, data);
    return res.data;
  },

  assignTeam: async (id: string, teamMemberIds: string[]) => {
    const res = await api.post<EventItem>(
      `/events/${id}/assign-team`,
      {
        team_member_ids: teamMemberIds,
      }
    );

    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/events/${id}`);
  },
};

export const photosApi = {
  upload: async (
    eventId: string,
    files: File[],
    onProgress?: (pct: number) => void
  ) => {
    const formData = new FormData();

    formData.append('event_id', eventId);

    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await api.post<PhotoItem[]>(
      '/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },

        onUploadProgress: (evt) => {
          if (evt.total && onProgress) {
            onProgress(
              Math.round((evt.loaded * 100) / evt.total)
            );
          }
        },
      }
    );

    return res.data;
  },

  list: async (
    eventId: string,
    selectedOnly = false
  ) => {
    const res = await api.get<PhotoItem[]>(
      `/photos/event/${eventId}`,
      {
        params: {
          selected_only: selectedOnly,
        },
      }
    );

    return res.data;
  },

  updateSelection: async (
    photoIds: string[],
    isSelected: boolean
  ) => {
    const res = await api.patch<{
      modified_count: number;
    }>('/photos/selection', {
      photo_ids: photoIds,
      is_selected: isSelected,
    });

    return res.data;
  },

  delete: async (photoId: string) => {
    await api.delete(`/photos/${photoId}`);
  },
};

export const galleriesApi = {
  publish: async (
    eventId: string,
    pin: string,
    slug?: string
  ) => {
    const res = await api.post<GallerySummary>(
      `/galleries/publish/${eventId}`,
      {
        pin,
        slug,
      }
    );

    return res.data;
  },

  getForEvent: async (eventId: string) => {
    const res = await api.get<{
      is_published: boolean;
      gallery: GallerySummary | null;
    }>(`/galleries/event/${eventId}`);

    return res.data;
  },

  getPublicInfo: async (slug: string) => {
    const res = await api.get<PublicGalleryInfo>(
      `/galleries/public/${slug}/info`
    );

    return res.data;
  },

  verifyPin: async (slug: string, pin: string) => {
    const res = await api.post<GalleryAccessData>(
      `/galleries/public/${slug}/verify`,
      {
        pin,
      }
    );

    return res.data;
  },

  getPhotos: async (
    slug: string,
    token: string
  ) => {
    const res = await api.get<PhotoItem[]>(
      `/galleries/public/${slug}/photos`,
      {
        headers: {
          'X-Gallery-Token': token,
        },
      }
    );

    return res.data;
  },

  getDownloadZipUrl: (
    slug: string,
    token: string
  ) => {
    return `${baseURL}/galleries/public/${slug}/download-zip?token=${encodeURIComponent(token)}`;
  },
};

/**
 * Returns full URL for photo/thumbnail paths.
 * In development: /api/... (handled by Vite proxy)
 * In production: https://trizenphotos.onrender.com/api/... (direct to Render)
 */
export const getAssetUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  // Remove /api prefix from relative path if baseURL already includes /api
  const cleanPath = path.startsWith('/api/') ? path.slice(4) : path.startsWith('/') ? path : `/${path}`;
  if (baseURL.endsWith('/api') || baseURL.endsWith('/api/')) {
    const baseWithoutTrailing = baseURL.replace(/\/+$/, '');
    return `${baseWithoutTrailing}${cleanPath}`;
  }
  return `${baseURL}${cleanPath}`;
};

export default api;