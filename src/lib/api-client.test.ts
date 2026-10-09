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

  it('handles timeout error gracefully', () => {
    const error = new AxiosError(
      'timeout of 15000ms exceeded',
      'ECONNABORTED',
      {} as InternalAxiosRequestConfig,
    );

    expect(getApiErrorMessage(error)).toContain('quá thời gian chờ (timeout)');
  });
});
