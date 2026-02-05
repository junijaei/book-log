/**
 * Book New Page
 *
 * Page for creating a new book entry.
 */

import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { createBook } from '@/api';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BUTTON_LABELS,
  FIELD_LABELS,
  MESSAGES,
  MISC,
  PAGE_TITLES,
  PLACEHOLDERS,
} from '@/lib/constants';
import type { BookFormData } from '@/types';

export function BookNewPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookFormData>({
    defaultValues: {
      title: '',
      author: '',
      cover_image_url: '',
      total_pages: '',
    },
  });

  const onSubmit = async (data: BookFormData) => {
    try {
      const response = await createBook({
        title: data.title,
        author: data.author,
        cover_image_url: data.cover_image_url || null,
        total_pages: data.total_pages ? parseInt(data.total_pages) : null,
      });

      navigate(`/books/${response.reading_log_id}`);
    } catch (error) {
      console.error('Failed to create book:', error);
      alert(MESSAGES.FAILED_TO_CREATE);
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{MISC.BOOK_DETAILS}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label={FIELD_LABELS.TITLE}
              required
              htmlFor="title"
              error={errors.title?.message}
            >
              <Input
                id="title"
                {...register('title', { required: MESSAGES.TITLE_AUTHOR_REQUIRED })}
              />
            </FormField>

            <FormField
              label={FIELD_LABELS.AUTHOR}
              required
              htmlFor="author"
              error={errors.author?.message}
            >
              <Input
                id="author"
                {...register('author', { required: MESSAGES.TITLE_AUTHOR_REQUIRED })}
              />
            </FormField>

            <FormField label={FIELD_LABELS.COVER_IMAGE_URL} htmlFor="cover_image_url">
              <Input
                id="cover_image_url"
                type="url"
                placeholder={PLACEHOLDERS.COVER_IMAGE_URL}
                {...register('cover_image_url')}
              />
            </FormField>

            <FormField label={FIELD_LABELS.TOTAL_PAGES} htmlFor="total_pages">
              <Input
                id="total_pages"
                type="number"
                min="1"
                {...register('total_pages', {
                  validate: value =>
                    !value || parseInt(value) > 0 || '페이지 수는 1 이상이어야 합니다',
                })}
              />
            </FormField>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? BUTTON_LABELS.CREATING : BUTTON_LABELS.CREATE}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
