import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          adminLogin: path.resolve(__dirname, 'admin-login.html'),
          supervisorLogin: path.resolve(__dirname, 'supervisor-login.html'),
          studentDashboard: path.resolve(__dirname, 'student-dashboard.html'),
          supervisorDashboard: path.resolve(__dirname, 'supervisor-dashboard.html'),
          supervisorRequests: path.resolve(__dirname, 'supervisor-requests.html'),
          adminDashboard: path.resolve(__dirname, 'admin-dashboard.html'),
          adminRequests: path.resolve(__dirname, 'admin-requests.html'),
          adminPcsSlots: path.resolve(__dirname, 'admin-pcs-slots.html'),
          adminAllocations: path.resolve(__dirname, 'admin-allocations.html'),
          adminLogs: path.resolve(__dirname, 'admin-logs.html'),
          adminUsers: path.resolve(__dirname, 'admin-users.html'),
          newRequest: path.resolve(__dirname, 'new-request.html'),
          emergencyRequest: path.resolve(__dirname, 'emergency-request.html'),
          myRequests: path.resolve(__dirname, 'my-requests.html'),
          mySchedule: path.resolve(__dirname, 'my-schedule.html'),
          profile: path.resolve(__dirname, 'profile.html'),
        },
      },
    },
  };
});
