import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateBook } from '@/hooks';
import {
  BUTTON_LABELS,
  FIELD_LABELS,
  MESSAGES,
  MISC,
  PAGE_TITLES,
  PLACEHOLDERS,
} from '@/lib/constants';
import type { BookFormData } from '@/types';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function BookNewPage() {
  const navigate = useNavigate();
  const createBookMutation = useCreateBook();

  const { control, handleSubmit } = useForm<BookFormData>({
    defaultValues: {
      title: '',
      author: '',
      cover_image_url: '',
      total_pages: '',
    },
  });

  const onSubmit = async (data: BookFormData) => {
    try {
      const response = await createBookMutation.mutateAsync({
        title: data.title,
        author: data.author,
        cover_image_url: data.cover_image_url || null,
        total_pages: data.total_pages ? parseInt(data.total_pages) : null,
      });

      navigate(`/books/${response.reading_log.id}`);
    } catch (error) {
      console.error('Failed to create book:', error);
      toast.error(MESSAGES.FAILED_TO_CREATE);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{PAGE_TITLES.BOOK_NEW}</h1>
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Link to="/">
                <Button variant="outline" size="sm">
                  {BUTTON_LABELS.CANCEL}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{MISC.BOOK_DETAILS}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: MESSAGES.TITLE_AUTHOR_REQUIRED }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="title">
                          {FIELD_LABELS.TITLE}{' '}
                          <span className="text-destructive">{MESSAGES.REQUIRED_FIELD}</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="title"
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="author"
                    control={control}
                    rules={{ required: MESSAGES.TITLE_AUTHOR_REQUIRED }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="author">
                          {FIELD_LABELS.AUTHOR}{' '}
                          <span className="text-destructive">{MESSAGES.REQUIRED_FIELD}</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="author"
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="cover_image_url"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cover_image_url">
                          {FIELD_LABELS.COVER_IMAGE_URL}
                        </FieldLabel>
                        <Input
                          {...field}
                          id="cover_image_url"
                          type="url"
                          placeholder={PLACEHOLDERS.COVER_IMAGE_URL}
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="total_pages"
                    control={control}
                    rules={{
                      validate: value =>
                        !value || parseInt(value) > 0 || '페이지 수는 1 이상이어야 합니다',
                    }}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="total_pages">{FIELD_LABELS.TOTAL_PAGES}</FieldLabel>
                        <Input
                          {...field}
                          id="total_pages"
                          type="number"
                          min="1"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={createBookMutation.isPending}>
                    {createBookMutation.isPending ? BUTTON_LABELS.CREATING : BUTTON_LABELS.CREATE}
                  </Button>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
