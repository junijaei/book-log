import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getReadingRecord,
  updateBook,
  updateReadingLog,
  deleteReadingLog,
  createQuote,
  updateQuote,
  deleteQuote,
} from '@/api/mock-api';
import type { ReadingRecord, ReadingStatus, Quote } from '@/types';

export function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Local state for editing
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    cover_image_url: '',
    total_pages: '',
  });

  const [logData, setLogData] = useState({
    status: 'want_to_read' as ReadingStatus,
    current_page: '',
    rating: '',
    start_date: '',
    end_date: '',
    review: '',
  });

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');

  const [originalRecord, setOriginalRecord] = useState<ReadingRecord | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadRecord = async () => {
      try {
        const data = await getReadingRecord(id);
        if (!data) {
          navigate('/');
          return;
        }

        setOriginalRecord(data);

        // Populate local state
        setBookData({
          title: data.book.title,
          author: data.book.author,
          cover_image_url: data.book.cover_image_url || '',
          total_pages: data.book.total_pages?.toString() || '',
        });

        setLogData({
          status: data.reading_log.status,
          current_page: data.reading_log.current_page?.toString() || '',
          rating: data.reading_log.rating?.toString() || '',
          start_date: data.reading_log.start_date || '',
          end_date: data.reading_log.end_date || '',
          review: data.reading_log.review || '',
        });

        setQuotes([...data.quotes]);
      } catch (error) {
        console.error('Failed to load record:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!originalRecord || !id) return;

    setSaving(true);
    try {
      // Update book
      await updateBook(originalRecord.book.id, {
        title: bookData.title,
        author: bookData.author,
        cover_image_url: bookData.cover_image_url || null,
        total_pages: bookData.total_pages ? parseInt(bookData.total_pages) : null,
      });

      // Update reading log
      await updateReadingLog(id, {
        status: logData.status,
        current_page: logData.current_page ? parseInt(logData.current_page) : null,
        rating: logData.rating ? parseInt(logData.rating) : null,
        start_date: logData.start_date || null,
        end_date: logData.end_date || null,
        review: logData.review || null,
      });

      // Handle quote changes (simplified: we won't track individual edits, just new ones)
      // In a real app, you'd track additions/edits/deletions separately

      navigate(`/books/${id}`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteReadingLog(id);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete record');
    }
  };

  const handleAddQuote = async () => {
    if (!newQuoteText || !newQuotePage || !id) return;

    try {
      const quote = await createQuote({
        reading_log_id: id,
        text: newQuoteText,
        page_number: parseInt(newQuotePage),
        noted_at: new Date().toISOString().split('T')[0],
      });

      setQuotes(prev => [...prev, quote]);
      setNewQuoteText('');
      setNewQuotePage('');
    } catch (error) {
      console.error('Failed to add quote:', error);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await deleteQuote(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to={`/books/${id}`}>
          <Button variant="outline" size="sm">
            ← Cancel
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Book Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Book Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={bookData.title}
              onChange={e => setBookData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={bookData.author}
              onChange={e => setBookData(prev => ({ ...prev, author: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cover">Cover Image URL</Label>
            <Input
              id="cover"
              value={bookData.cover_image_url}
              onChange={e => setBookData(prev => ({ ...prev, cover_image_url: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="pages">Total Pages</Label>
            <Input
              id="pages"
              type="number"
              value={bookData.total_pages}
              onChange={e => setBookData(prev => ({ ...prev, total_pages: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reading Log */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reading Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={logData.status}
              onChange={e => setLogData(prev => ({ ...prev, status: e.target.value as ReadingStatus }))}
            >
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Reading</option>
              <option value="finished">Finished</option>
              <option value="abandoned">Abandoned</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="currentPage">Current Page</Label>
            <Input
              id="currentPage"
              type="number"
              value={logData.current_page}
              onChange={e => setLogData(prev => ({ ...prev, current_page: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={logData.rating}
              onChange={e => setLogData(prev => ({ ...prev, rating: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={logData.start_date}
                onChange={e => setLogData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={logData.end_date}
                onChange={e => setLogData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              value={logData.review}
              onChange={e => setLogData(prev => ({ ...prev, review: e.target.value }))}
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing quotes */}
          {quotes.map(quote => (
            <div key={quote.id} className="border rounded p-4 space-y-2">
              <p className="text-foreground">"{quote.text}"</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Page {quote.page_number}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteQuote(quote.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {/* Add new quote */}
          <div className="border-t pt-4 space-y-2">
            <Label>Add New Quote</Label>
            <Textarea
              placeholder="Quote text..."
              value={newQuoteText}
              onChange={e => setNewQuoteText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Page number"
                value={newQuotePage}
                onChange={e => setNewQuotePage(e.target.value)}
                className="w-32"
              />
              <Button onClick={handleAddQuote} disabled={!newQuoteText || !newQuotePage}>
                Add Quote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reading Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reading record? This action cannot be undone.
              {originalRecord && !originalRecord.book && (
                <span className="block mt-2 font-medium">
                  This will also delete the book as it has no other reading logs.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
