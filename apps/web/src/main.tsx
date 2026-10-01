import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { appRoutes } from './app/app';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/app-providers';

const router = createBrowserRouter(appRoutes);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
