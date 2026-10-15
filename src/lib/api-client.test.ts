import { describe, it, expect } from 'vitest';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage } from './api-client';

describe('getApiErrorMessage', () => {
  it('extracts string message from backend response', () => {
    const error = new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      {} as InternalAxiosRequestConfig,
      {},
      {
        status: 401,
        data: { message: 'Thông tin đăng nhập không chính xác' },
      } as AxiosResponse,
    );

    expect(getApiErrorMessage(error)).toBe('Thông tin đăng nhập không chính xác');
  });

  it('joins array of messages from NestJS ValidationPipe', () => {
    const error = new AxiosError(
      'Validation error',
      'ERR_BAD_REQUEST',
      {} as InternalAxiosRequestConfig,
      {},
      {
        status: 400,
        data: { message: ['Mật khẩu quá ngắn', 'Email không hợp lệ'] },
      } as AxiosResponse,
    );

    expect(getApiErrorMessage(error)).toBe('Mật khẩu quá ngắn. Email không hợp lệ');
  });

  it('handles network error when server is unreachable', () => {
    const error = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      {} as InternalAxiosRequestConfig,
    );

    expect(getApiErrorMessage(error)).toContain('Không thể kết nối tới máy chủ');
  });

  it('handles HTTP status codes when response data message is absent', () => {
    const createError = (status: number) =>
      new AxiosError(
        `Request failed with status code ${status}`,
        'ERR_BAD_REQUEST',
        {} as InternalAxiosRequestConfig,
        {},
        {
          status,
          data: {},
        } as AxiosResponse,
      );

    expect(getApiErrorMessage(createError(400))).toBe('Dữ liệu gửi lên không hợp lệ.');
    expect(getApiErrorMessage(createError(401))).toBe(
      'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
    );
    expect(getApiErrorMessage(createError(403))).toBe(
      'Bạn không có quyền thực hiện thao tác này.',
    );
    expect(getApiErrorMessage(createError(404))).toBe('Không tìm thấy tài nguyên yêu cầu.');
    expect(getApiErrorMessage(createError(409))).toBe(
      'Dữ liệu bị xung đột hoặc đã tồn tại trong hệ thống.',
    );
    expect(getApiErrorMessage(createError(500))).toBe('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
    expect(getApiErrorMessage(createError(503))).toBe('Đã xảy ra lỗi (503). Vui lòng thử lại.');
  });

  it('handles standard Error instances and unknown objects', () => {
    expect(getApiErrorMessage(new Error('Lỗi tùy biến'))).toBe('Lỗi tùy biến');
    expect(getApiErrorMessage('Something went wrong')).toBe('Đã xảy ra lỗi không xác định.');
    expect(getApiErrorMessage(null)).toBe('Đã xảy ra lỗi không xác định.');
  });
});
