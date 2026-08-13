import { fireEvent, render, screen } from '@testing-library/react';
import { EditorPage } from './editor-page';

describe('EditorPage', () => {
  it('should add a node to the canvas', () => {
    render(<EditorPage />);

    const addNodeButton = screen.getByRole('button', {
      name: 'Add node',
    });

    fireEvent.click(addNodeButton);

    expect(screen.getByText('Node 1')).toBeTruthy();
  });
});
