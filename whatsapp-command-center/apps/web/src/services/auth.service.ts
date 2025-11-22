import apiClient from '@/lib/api-client';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  organizationSlug: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterDto) {
    const response = await apiClient.post('/auth/register', data);
    const { user, organization, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('organization', JSON.stringify(organization));

    return { user, organization };
  },

  async login(data: LoginDto) {
    const response = await apiClient.post('/auth/login', data);
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    const { user } = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    window.location.href = '/login';
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getOrganization() {
    const org = localStorage.getItem('organization');
    return org ? JSON.parse(org) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};
