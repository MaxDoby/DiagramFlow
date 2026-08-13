import { Route, Routes } from 'react-router-dom';
import EditorPage from './editor/editor-page';

export function App() {
  return (
    <Routes>
      <Route path="/diagrams/:diagramId/editor" element={<EditorPage />} />
    </Routes>
  );
}
export default App;
