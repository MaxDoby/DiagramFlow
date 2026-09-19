import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appRoutes } from './app';
import { getDiagram } from '../features/editor/api/editor-api';
vi.mock('../features/editor/api/editor-api', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../features/editor/api/editor-api')
  >()),
  getDiagram: vi.fn(),
}));
it('renders the editor route and waits for loading to finish', async () => {
  vi.mocked(getDiagram).mockRejectedValue(new Error('Unavailable'));
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ['/diagrams/22222222-2222-4222-8222-222222222222/editor'],
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Unable to load the diagram',
  );
});
