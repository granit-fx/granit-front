import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileDropZone } from '../components/import/file-drop-zone';

import { renderDataExchange } from './test-utils';

function makeFile(name = 'data.csv'): File {
  return new File(['col\n1'], name, { type: 'text/csv' });
}

describe('FileDropZone', () => {
  it('should expose the data-slot attribute and accepted formats hint', () => {
    renderDataExchange(<FileDropZone accept={['.csv', '.xlsx']} onFileSelect={vi.fn()} />);
    expect(document.querySelector('[data-slot="file-drop-zone"]')).toBeInTheDocument();
    expect(screen.getByText(/Accepted:/)).toBeInTheDocument();
  });

  it('should not render the accepted hint when accept is omitted', () => {
    renderDataExchange(<FileDropZone onFileSelect={vi.fn()} />);
    expect(screen.queryByText(/Accepted:/)).not.toBeInTheDocument();
  });

  it('should open the file browser on click', async () => {
    const onFileSelect = vi.fn();
    const { user } = renderDataExchange(<FileDropZone onFileSelect={onFileSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    await user.click(screen.getByRole('button'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should call onFileSelect when a file is chosen via the input', () => {
    const onFileSelect = vi.fn();
    renderDataExchange(<FileDropZone onFileSelect={onFileSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });
    expect(onFileSelect).toHaveBeenCalledTimes(1);
  });

  it('should not call onFileSelect when the input change has no files', () => {
    const onFileSelect = vi.fn();
    renderDataExchange(<FileDropZone onFileSelect={onFileSelect} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should handle drag-over, drag-leave and drop with a file', () => {
    const onFileSelect = vi.fn();
    renderDataExchange(<FileDropZone onFileSelect={onFileSelect} />);
    const zone = screen.getByRole('button');
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile()] } });
    expect(onFileSelect).toHaveBeenCalledTimes(1);
  });

  it('should ignore drop with no file', () => {
    const onFileSelect = vi.fn();
    renderDataExchange(<FileDropZone onFileSelect={onFileSelect} />);
    const zone = screen.getByRole('button');
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should not select files when disabled', () => {
    const onFileSelect = vi.fn();
    renderDataExchange(<FileDropZone disabled onFileSelect={onFileSelect} />);
    const zone = screen.getByRole('button');
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile()] } });
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
