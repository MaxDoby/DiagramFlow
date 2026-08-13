import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from './app';

describe('App', () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      '',
      '/diagrams/22222222-2222-4222-8222-222222222222/editor',
    );
  });

  it('should render the diagram editor route', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    const editorPage = container.querySelector('main.editor-page');
    expect(editorPage).toBeTruthy();
  });
});
