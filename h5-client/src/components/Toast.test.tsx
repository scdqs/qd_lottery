/**
 * Toast组件测试 (H5端)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast, ToastContainer, useToast } from './Toast';
import { renderHook, act } from '@testing-library/react';

describe('Toast', () => {
  test('renders toast with correct type and message', () => {
    render(
      <Toast
        type="error"
        message="Test error message"
        duration={0}
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  test('renders different icons for different types', () => {
    const { rerender } = render(
      <Toast type="error" message="Error" duration={0} />
    );
    expect(screen.getByText('❌')).toBeInTheDocument();

    rerender(<Toast type="warning" message="Warning" duration={0} />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Toast type="success" message="Success" duration={0} />);
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<Toast type="info" message="Info" duration={0} />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  test('closes toast when clicked', async () => {
    const onClose = jest.fn();
    render(
      <Toast
        type="info"
        message="Test message"
        duration={0}
        onClose={onClose}
      />
    );

    const toast = screen.getByText('Test message').closest('.toast');
    fireEvent.click(toast!);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('auto-closes after duration', async () => {
    const onClose = jest.fn();
    render(
      <Toast
        type="info"
        message="Test message"
        duration={100}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});

describe('ToastContainer', () => {
  test('renders multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'error' as const, message: 'Error 1' },
      { id: '2', type: 'success' as const, message: 'Success 1' },
      { id: '3', type: 'info' as const, message: 'Info 1' },
    ];

    const onRemove = jest.fn();

    render(
      <ToastContainer
        toasts={toasts}
        onRemove={onRemove}
      />
    );

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Success 1')).toBeInTheDocument();
    expect(screen.getByText('Info 1')).toBeInTheDocument();
  });
});

describe('useToast', () => {
  test('adds and removes toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Error message');
    expect(result.current.toasts[0].type).toBe('error');

    act(() => {
      result.current.removeToast(result.current.toasts[0].id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  test('provides convenience methods for different types', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error');
      result.current.showWarning('Warning');
      result.current.showSuccess('Success');
      result.current.showInfo('Info');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[1].type).toBe('warning');
    expect(result.current.toasts[2].type).toBe('success');
    expect(result.current.toasts[3].type).toBe('info');
  });

  test('clears all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error 1');
      result.current.showError('Error 2');
      result.current.showError('Error 3');
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
