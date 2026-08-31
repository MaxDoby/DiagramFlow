import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditorPage } from './editor-page';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { getDiagram, saveDiagramSnapshot } from '../api/editor-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api/editor-api', () => ({
  getDiagram: vi.fn(),
  saveDiagramSnapshot: vi.fn(),
}));

const getDiagramMock = vi.mocked(getDiagram);
const saveDiagramSnapshotMock = vi.mocked(saveDiagramSnapshot);

const diagramId = '22222222-2222-4222-8222-222222222222';
const timestamp = '2030-01-01T12:00:00.000Z';
const diagramResponse = {
  id: diagramId,
  name: 'System Architecture',
  folderId: null,
  version: 0,
  snapshot: {
    nodes: [],
    edges: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  },
  createdAt: timestamp,
  updatedAt: timestamp,
};

const renderEditor = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/diagrams/${diagramId}/editor`]}>
        <Routes>
          <Route path="/diagrams/:diagramId/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('EditorPage', () => {
  beforeEach(() => {
    getDiagramMock.mockReset();
    getDiagramMock.mockResolvedValue(diagramResponse);
    saveDiagramSnapshotMock.mockReset();
    saveDiagramSnapshotMock.mockResolvedValue({
      version: 1,
      updatedAt: timestamp,
    });
  });

  it('should add a node to the canvas', async () => {
    renderEditor();

    const addRectangleButton = await screen.findByRole('button', {
      name: 'Add Rectangle',
    });

    fireEvent.click(addRectangleButton);

    expect(screen.getByText('Rectangle')).toBeTruthy();
  });

  it('should render nodes from the loaded snapshot', async () => {
    getDiagramMock.mockResolvedValue({
      ...diagramResponse,
      snapshot: {
        ...diagramResponse.snapshot,
        nodes: [
          {
            id: 'node-1',
            type: 'shape',
            position: {
              x: 120,
              y: 80,
            },
            width: 140,
            height: 80,
            zIndex: 0,
            data: {
              label: 'API Gateway',
              shapeType: 'rectangle',
              backgroundColor: '#ffffff',
              borderColor: '#52525b',
              borderWidth: 2,
              opacity: 1,
              rotation: 0,
              fontFamily: 'sans',
              textAlign: 'center',
            },
          },
        ],
      },
    });

    renderEditor();

    expect(await screen.findByText('API Gateway')).toBeTruthy();
    expect(getDiagramMock).toHaveBeenCalledWith(diagramId);
  });

  it('should show an error when diagram loading fails', async () => {
    getDiagramMock.mockRejectedValue(new Error('Network failure'));

    renderEditor();

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toBe('Unable to load the diagram');
    expect(
      screen.queryByRole('button', {
        name: 'Add node',
      }),
    ).toBeNull();
  });

  it('should use the latest version when saving the snapshot', async () => {
    renderEditor();

    const firstSaveButton = await screen.findByRole('button', {
      name: 'Save',
    });

    fireEvent.click(firstSaveButton);

    await waitFor(() => {
      expect(saveDiagramSnapshotMock).toHaveBeenNthCalledWith(1, diagramId, {
        snapshot: diagramResponse.snapshot,
        expectedVersion: 0,
      });
    });

    const secondSaveButton = await screen.findByRole('button', {
      name: 'Save',
    });

    fireEvent.click(secondSaveButton);

    await waitFor(() => {
      expect(saveDiagramSnapshotMock).toHaveBeenNthCalledWith(2, diagramId, {
        snapshot: diagramResponse.snapshot,
        expectedVersion: 1,
      });
    });
  });
});
