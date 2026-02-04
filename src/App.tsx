import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { BookListPage } from './pages/book-list';
import { BookDetailPage } from './pages/book-detail';
import { BookEditPage } from './pages/book-edit';
import { BookNewPage } from './pages/book-new';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BookListPage />} />
          <Route path="/books/new" element={<BookNewPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/books/:id/edit" element={<BookEditPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
