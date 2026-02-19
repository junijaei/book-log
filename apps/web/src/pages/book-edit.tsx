import { BookEditSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteReadingRecord, useReadingRecord, useUpsertReadingRecord } from '@/hooks';
import { messages } from '@/constants/messages';
import { getReadingStatusLabel, getVisibilityLabel } from '@/lib/constants';
import type {
  BookEditFormData,
  LocalQuote,
  NewQuoteFormData,
  Quote,
  ReadingStatus,
  Visibility,
} from '@/types';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'finished', 'abandoned'];
const VISIBILITIES: Visibility[] = ['public', 'friends', 'private'];

export function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: record, isLoading } = useReadingRecord(id);
  const upsertMutation = useUpsertReadingRecord();
  const deleteMutation = useDeleteReadingRecord();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<BookEditFormData>({
    defaultValues: {
      title: '',
      author: '',
      cover_image_url: '',
      total_pages: '',
      status: 'want_to_read',
      current_page: '',
      rating: '',
      start_date: '',
      end_date: '',
      review: '',
      visibility: 'public' as Visibility,
    },
  });

  const [quotes, setQuotes] = useState<LocalQuote[]>([]);
  const [deletedQuoteIds, setDeletedQuoteIds] = useState<string[]>([]);

  const {
    control: controlQuote,
    handleSubmit: handleQuoteSubmit,
    reset: resetQuote,
    watch: watchQuote,
  } = useForm<NewQuoteFormData>({
    defaultValues: { text: '', page_number: '' },
  });

  const newQuoteText = watchQuote('text');
  const newQuotePage = watchQuote('page_number');

  useEffect(() => {
    if (!record) return;

    reset({
      title: record.book.title,
      author: record.book.author,
      cover_image_url: record.book.cover_image_url || '',
      total_pages: record.book.total_pages?.toString() || '',
      status: record.reading_log.status,
      current_page: record.reading_log.current_page?.toString() || '',
      rating: record.reading_log.rating?.toString() || '',
      start_date: record.reading_log.start_date || '',
      end_date: record.reading_log.end_date || '',
      review: record.reading_log.review || '',
      visibility: record.reading_log.visibility || 'public',
    });

    setQuotes(
      record.quotes.map((q: Quote) => ({
        id: q.id,
        text: q.text,
        page_number: q.page_number,
        noted_at: q.noted_at,
      }))
    );
  }, [record, reset]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = async (data: BookEditFormData) => {
    if (!record || !id) return;

    try {
      await upsertMutation.mutateAsync({
        book: {
          id: record.book.id,
          title: data.title,
          author: data.author,
          cover_image_url: data.cover_image_url || null,
          total_pages: data.total_pages ? parseInt(data.total_pages) : null,
        },
        reading_log: {
          id: id,
          status: data.status,
          current_page: data.current_page ? parseInt(data.current_page) : null,
          rating: data.rating ? parseInt(data.rating) : null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          review: data.review || null,
          visibility: data.visibility,
        },
        quotes: quotes.map(q => ({
          id: q.id,
          text: q.text,
          page_number: q.page_number,
          noted_at: q.noted_at,
        })),
        delete_quote_ids: deletedQuoteIds.length > 0 ? deletedQuoteIds : undefined,
      });

      navigate(`/books/${id}`);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(messages.common.errors.failedToSave);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteMutation.mutateAsync({ reading_log_id: id });
      navigate('/');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(messages.common.errors.failedToDelete);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const onAddQuote = (data: NewQuoteFormData) => {
    const newQuote: LocalQuote = {
      text: data.text,
      page_number: parseInt(data.page_number),
      noted_at: new Date().toISOString().split('T')[0],
      isNew: true,
    };

    setQuotes(prev => [...prev, newQuote]);
    resetQuote();
  };

  const handleDeleteQuote = (index: number) => {
    const quote = quotes[index];

    if (quote.id) {
      setDeletedQuoteIds(prev => [...prev, quote.id!]);
    }

    setQuotes(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-3 max-w-4xl">
            <div className="flex justify-between items-center">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  ← {messages.common.buttons.cancel}
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 max-w-4xl">
          <BookEditSkeleton />
        </main>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen">
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">{messages.books.messages.notFound}</p>
          <Link to="/">
            <Button variant="outline" size="sm">
              {messages.books.buttons.backToList}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.id !== record.reading_log.user_id) {
    return <Navigate to={`/books/${id}`} replace />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isDirty && !confirm(messages.common.messages.unsavedChanges)) return;
                navigate(`/books/${id}`);
              }}
            >
              ← {messages.common.buttons.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || deleteMutation.isPending}
            >
              {isSubmitting ? messages.common.buttons.saving : messages.common.buttons.save}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* SECTION 1: Book Information */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{messages.books.details.bookInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="title">{messages.books.fields.title}</FieldLabel>
                        <Input {...field} id="title" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="author"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="author">{messages.books.fields.author}</FieldLabel>
                        <Input {...field} id="author" aria-invalid={fieldState.invalid} />
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
                          {messages.books.fields.coverImageUrl}
                        </FieldLabel>
                        <Input {...field} id="cover_image_url" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="total_pages"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="total_pages">
                          {messages.books.fields.totalPages}
                        </FieldLabel>
                        <Input
                          {...field}
                          id="total_pages"
                          type="number"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* SECTION 2: Reading Record */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{messages.books.details.readingLog}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-5">
                {/* Status & Progress row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="status">{messages.books.fields.status}</FieldLabel>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={value => value && field.onChange(value)}
                        >
                          <SelectTrigger id="status" aria-invalid={fieldState.invalid}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {READING_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {getReadingStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="current_page"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="current_page">
                          {messages.books.fields.currentPage}
                        </FieldLabel>
                        <Input
                          {...field}
                          id="current_page"
                          type="number"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="rating"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="rating">{messages.books.fields.rating}</FieldLabel>
                        <Input
                          {...field}
                          id="rating"
                          type="number"
                          min="1"
                          max="5"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="visibility"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="visibility">
                        {messages.books.fields.visibility}
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={value => value && field.onChange(value)}
                      >
                        <SelectTrigger id="visibility" aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITIES.map(v => (
                            <SelectItem key={v} value={v}>
                              {getVisibilityLabel(v)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Field>
                  <FieldLabel htmlFor="reading_period">
                    {messages.books.fields.readingPeriod}
                  </FieldLabel>
                  <DateRangePicker
                    id="reading_period"
                    value={{
                      from: watch('start_date') || undefined,
                      to: watch('end_date') || undefined,
                    }}
                    onChange={(value: DateRangeValue) => {
                      setValue('start_date', value.from ?? '');
                      setValue('end_date', value.to ?? '');
                    }}
                    placeholder="독서 기간 선택"
                  />
                </Field>

                {/* Review - larger textarea with better line height */}
                <Controller
                  name="review"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="review">{messages.books.fields.review}</FieldLabel>
                      <Textarea
                        {...field}
                        id="review"
                        rows={6}
                        className="leading-relaxed"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </form>

        {/* SECTION 3: Quotes */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{messages.books.fields.quotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-5">
              {/* Add new quote form */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <Controller
                  name="text"
                  control={controlQuote}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new_quote_text">
                        {messages.books.quotes.addNew}
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="new_quote_text"
                        placeholder={messages.books.placeholders.quoteText}
                        rows={4}
                        className="min-h-[120px] leading-relaxed"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <div className="flex gap-3 items-center">
                  <Controller
                    name="page_number"
                    control={controlQuote}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        placeholder={messages.books.placeholders.pageNumber}
                        className="w-28"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuoteSubmit(onAddQuote)}
                    disabled={!newQuoteText || !newQuotePage}
                  >
                    {messages.common.buttons.add}
                  </Button>
                </div>
              </div>

              {/* Existing quotes list */}
              {quotes.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {quotes.length}
                    {messages.books.details.pagesUnit}
                  </h4>
                  {quotes.map((quote, index) => (
                    <div
                      key={quote.id ?? `new-${index}`}
                      className="border-l-2 border-primary/20 pl-4 py-3 group"
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        &ldquo;{quote.text}&rdquo;
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-muted-foreground">
                          p.{quote.page_number}
                          {quote.isNew && (
                            <span className="ml-2 text-blue-500">
                              ({messages.books.quotes.willBeAddedOnSave})
                            </span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuote(index)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          {messages.common.buttons.delete}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FieldGroup>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{messages.books.confirmations.deleteTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground pb-4 text-sm">
              {messages.books.confirmations.deleteContent}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {messages.common.buttons.delete}
            </Button>
          </CardContent>
        </Card>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {messages.books.confirmations.deleteTitle}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {messages.books.confirmations.deleteMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? messages.common.buttons.deleting
                : messages.common.buttons.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
