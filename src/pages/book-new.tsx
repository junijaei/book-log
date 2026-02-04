import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { ThemeToggle } from '@/components/theme-toggle';
import { createReadingRecord } from '@/api/mock-api';
import type { ReadingStatus } from '@/types';
import {
  PAGE_TITLES,
  BUTTON_LABELS,
  FIELD_LABELS,
  PLACEHOLDERS,
  MESSAGES,
  MISC,
  getReadingStatusLabel,
} from '@/lib/constants';

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
      alert(MESSAGES.TITLE_AUTHOR_REQUIRED);
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
      alert(MESSAGES.FAILED_TO_CREATE);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <PageHeader
        title={PAGE_TITLES.BOOK_NEW}
        actions={
          <>
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm">
                {BUTTON_LABELS.CANCEL}
              </Button>
            </Link>
          </>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{MISC.BOOK_DETAILS}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label={FIELD_LABELS.TITLE} required htmlFor="title">
              <Input
                id="title"
                required
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </FormField>

            <FormField label={FIELD_LABELS.AUTHOR} required htmlFor="author">
              <Input
                id="author"
                required
                value={formData.author}
                onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
              />
            </FormField>

            <FormField label={FIELD_LABELS.COVER_IMAGE_URL} htmlFor="cover">
              <Input
                id="cover"
                type="url"
                value={formData.cover_image_url}
                onChange={e => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                placeholder={PLACEHOLDERS.COVER_IMAGE_URL}
              />
            </FormField>

            <FormField label={FIELD_LABELS.TOTAL_PAGES} htmlFor="pages">
              <Input
                id="pages"
                type="number"
                min="1"
                value={formData.total_pages}
                onChange={e => setFormData(prev => ({ ...prev, total_pages: e.target.value }))}
              />
            </FormField>

            <FormField label={FIELD_LABELS.STATUS} htmlFor="status">
              <Select
                id="status"
                value={formData.status}
                onChange={e =>
                  setFormData(prev => ({ ...prev, status: e.target.value as ReadingStatus }))
                }
              >
                {(['want_to_read', 'reading', 'finished', 'abandoned'] as const).map(status => (
                  <option key={status} value={status}>
                    {getReadingStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={FIELD_LABELS.START_DATE} htmlFor="startDate">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </FormField>
              <FormField label={FIELD_LABELS.END_DATE} htmlFor="endDate">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? BUTTON_LABELS.CREATING : BUTTON_LABELS.CREATE}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
