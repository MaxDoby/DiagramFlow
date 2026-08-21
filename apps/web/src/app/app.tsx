import { Navigate, Route, Routes } from 'react-router-dom';
import { ConfirmEmailPage } from '../features/auth/pages/confirm-email-page';
import { LoginPage } from '../features/auth/pages/login-page';
import { RegisterPage } from '../features/auth/pages/register-page';
import { DiagramsPage } from '../features/diagrams/pages/diagrams-page';
import EditorPage from '../features/editor/pages/editor-page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/diagrams" element={<DiagramsPage />} />
      <Route path="/diagrams/:diagramId/editor" element={<EditorPage />} />
    </Routes>
  );
}
export default App;
