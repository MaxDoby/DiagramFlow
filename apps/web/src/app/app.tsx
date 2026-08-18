import { Navigate, Route, Routes } from 'react-router-dom';
import EditorPage from './editor/editor-page';
import { ConfirmEmailPage } from './auth/confirm-email-page';
import { LoginPage } from './auth/login-page';
import { RegisterPage } from './auth/register-page';
import { DiagramsPage } from './diagrams/diagrams-page';

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
