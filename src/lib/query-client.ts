import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 phút
      gcTime: 1000 * 60 * 10, // 10 phút
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Không thử lại nếu lỗi 401, 403, 404
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
