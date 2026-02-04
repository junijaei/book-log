import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createReadingRecord } from '@/api/mock-api';
import type { ReadingStatus } from '@/types';

export function BookNewPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    cover_image_url: '',
    total_pages: '',
    status: 'want_to_read' as ReadingStatus,
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.author) {
      alert('Title and author are required');
      return;
    }

    setSaving(true);
    try {
      const record = await createReadingRecord(
        {
          title: formData.title,
          author: formData.author,
          cover_image_url: formData.cover_image_url || null,
          total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
        },
        {
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }
      );

      navigate(`/books/${record.reading_log.id}`);
    } catch (error) {
      console.error('Failed to create book:', error);
      alert('Failed to create book');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add New Book</h1>
        <Link to="/">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="author">
                Author <span className="text-destructive">*</span>
              </Label>
              <Input
                id="author"
                required
                value={formData.author}
                onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                type="url"
                value={formData.cover_image_url}
                onChange={e => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <div>
              <Label htmlFor="pages">Total Pages</Label>
              <Input
                id="pages"
                type="number"
                min="1"
                value={formData.total_pages}
                onChange={e => setFormData(prev => ({ ...prev, total_pages: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Reading Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={e =>
                  setFormData(prev => ({ ...prev, status: e.target.value as ReadingStatus }))
                }
              >
                <option value="want_to_read">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
                <option value="abandoned">Abandoned</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Creating...' : 'Create Book'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
