import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackButton } from './FeedbackButton';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path) => `asset://${path}`),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), // Mock PNG header
}));

vi.mock('tauri-plugin-screenshots-api', () => ({
  getScreenshotableWindows: vi.fn().mockResolvedValue([{ id: 1, title: 'Structure Labs' }]),
  getWindowScreenshot: vi.fn().mockResolvedValue('/tmp/screenshot.png'),
}));

// Mock Workbench
vi.mock('../../../lib/Workbench', () => ({
  Workbench: {
    getInstance: () => ({
      getState: () => ({
        activeTab: 'timeline',
        isFocusMode: false,
        analysis: { status: 'idle' },
      }),
    }),
  },
}));

// Mock AnnotationCanvas to avoid canvas issues in this test
vi.mock('./AnnotationCanvas', () => ({
  AnnotationCanvas: ({ onConfirm }: any) => (
    <div data-testid="annotation-canvas">
      <button onClick={() => onConfirm('data:image/png;base64,annotated')}>Confirm Annotation</button>
    </div>
  ),
}));

describe('FeedbackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock import.meta.env.DEV
    vi.stubGlobal('import.meta', { env: { DEV: true } });
  });

  it('submits feedback with title, description and screenshot', async () => {
    (invoke as any).mockResolvedValue('https://github.com/issue/1');

    render(<FeedbackButton />);
    
    // Open modal
    fireEvent.click(screen.getByTitle(/send feedback/i));
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/brief summary/i), { target: { value: 'Bug report' } });
    fireEvent.change(screen.getByPlaceholderText(/details about your feedback/i), { target: { value: 'Something is broken' } });
    
    // Capture screenshot
    fireEvent.click(screen.getByText(/capture screen/i));
    
    // Wait for annotator and confirm
    const confirmBtn = await screen.findByText(/confirm annotation/i);
    fireEvent.click(confirmBtn);
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('submit_feedback', expect.object_of_payload({
        title: 'Bug report',
        description: 'Something is broken',
        image_base64: 'data:image/png;base64,annotated',
      }));
    });
    
    expect(screen.getByText(/feedback submitted/i)).toBeInTheDocument();
  });

  it('shows error message on submission failure', async () => {
    (invoke as any).mockRejectedValue('GitHub API error: 401 Unauthorized');

    render(<FeedbackButton />);
    
    // Open modal
    fireEvent.click(screen.getByTitle(/send feedback/i));
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/brief summary/i), { target: { value: 'Bug report' } });
    fireEvent.change(screen.getByPlaceholderText(/details about your feedback/i), { target: { value: 'Something is broken' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/GitHub API error: 401 Unauthorized/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/feedback submitted/i)).not.toBeInTheDocument();
  });
});

// Helper for expect.objectContaining with custom matcher if needed
expect.extend({
  object_of_payload(received, expected) {
    const { payload } = received;
    const pass = this.equals(payload.title, expected.title) && 
                 this.equals(payload.description, expected.description) &&
                 this.equals(payload.image_base64, expected.image_base64);
    return {
      pass,
      message: () => `expected payload to match ${JSON.stringify(expected)}`,
    };
  }
});
