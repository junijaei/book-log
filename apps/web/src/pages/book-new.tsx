import { BookSearchInput } from '@/components/book-search-input';
import { BookCover } from '@/components/book-cover';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useBookLookup, useCreateBook, useIsMobile } from '@/hooks';
import { messages } from '@/constants/messages';
import type { AladinBook, BookFormData } from '@/types';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type MobileStep = 'search' | 'confirm' | 'form';

function SelectedBookPreview({ book }: { book: AladinBook }) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card">
      <div className="shrink-0 w-20 h-28 rounded overflow-hidden bg-muted">
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
            {messages.books.details.noCover}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{book.title}</p>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.publisher}</p>
        {book.totalPages && (
          <p className="text-xs text-muted-foreground">
            {book.totalPages} {messages.books.details.pagesUnit}
          </p>
        )}
      </div>
    </div>
  );
}

function BookForm({
  selectedBook,
  onSubmit,
  isPending,
  showSearch = false,
  onSearchSelect,
}: {
  selectedBook: AladinBook | null;
  onSubmit: (data: BookFormData) => Promise<void>;
  isPending: boolean;
  showSearch?: boolean;
  onSearchSelect?: (book: AladinBook) => void;
}) {
  const { control, handleSubmit, setValue, watch } = useForm<BookFormData>({
    defaultValues: {
      title: selectedBook?.title ?? '',
      author: selectedBook?.author ?? '',
      cover_image_url: selectedBook?.cover ?? '',
      total_pages: selectedBook?.totalPages?.toString() ?? '',
    },
  });

  const coverUrl = watch('cover_image_url');

  function handleBookSelect(book: AladinBook) {
    setValue('title', book.title, { shouldValidate: true });
    setValue('author', book.author, { shouldValidate: true });
    setValue('cover_image_url', book.cover ?? '');
    setValue('total_pages', book.totalPages?.toString() ?? '');
    onSearchSelect?.(book);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        {showSearch && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal mb-2">
              {messages.books.search.title}
            </CardTitle>
            <BookSearchInput onSelect={handleBookSelect} />
          </CardHeader>
        )}

        <CardHeader className={showSearch ? 'pt-4 pb-4' : 'pb-4'}>
          <CardTitle className="text-base">{messages.books.details.bookInfo}</CardTitle>
        </CardHeader>

        <CardContent>
          <FieldGroup className="gap-4">
            {coverUrl && (
              <div className="flex justify-center">
                <BookCover url={coverUrl} alt="표지 미리보기" size="md" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="title"
                control={control}
                rules={{ required: messages.books.messages.titleAuthorRequired }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="title">
                      {messages.books.fields.title}{' '}
                      <span className="text-destructive">
                        {messages.common.states.requiredField}
                      </span>
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
                rules={{ required: messages.books.messages.titleAuthorRequired }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="author">
                      {messages.books.fields.author}{' '}
                      <span className="text-destructive">
                        {messages.common.states.requiredField}
                      </span>
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
                      {messages.books.fields.coverImageUrl}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="cover_image_url"
                      type="url"
                      placeholder={messages.books.placeholders.coverImageUrl}
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
                    <FieldLabel htmlFor="total_pages">
                      {messages.books.fields.totalPages}
                    </FieldLabel>
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
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? messages.common.buttons.saving : messages.common.buttons.save}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}

function MobileView() {
  const navigate = useNavigate();
  const createBookMutation = useCreateBook();
  const [step, setStep] = useState<MobileStep>('search');
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null);

  const { data: lookedUpBook, isFetching: isLookingUp } = useBookLookup(
    selectedBook?.isbn13 ?? null
  );

  const resolvedBook = lookedUpBook
    ? { ...selectedBook!, totalPages: lookedUpBook.totalPages ?? selectedBook!.totalPages }
    : selectedBook;

  async function handleSubmitFromConfirm() {
    if (!resolvedBook) return;
    try {
      const response = await createBookMutation.mutateAsync({
        title: resolvedBook.title,
        author: resolvedBook.author,
        cover_image_url: resolvedBook.cover || null,
        total_pages: resolvedBook.totalPages ?? null,
      });
      navigate(`/books/${response.reading_log.id}`);
    } catch {
      toast.error(messages.common.errors.failedToCreate);
    }
  }

  function handleSearchSelect(book: AladinBook) {
    setSelectedBook(book);
    setStep('confirm');
  }

  function handleBack() {
    if (step === 'form' && selectedBook) {
      setStep('confirm');
    } else {
      setStep('search');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {step !== 'search' && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={messages.common.buttons.back}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-xl font-bold">{messages.books.pages.new}</h1>
            </div>
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Link to="/">
                <Button variant="outline" size="sm">
                  {messages.common.buttons.cancel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl flex flex-col">
        {step === 'search' && (
          <div className="flex flex-col flex-1 gap-4">
            <p className="text-sm text-muted-foreground">{messages.books.search.resultHint}</p>
            <BookSearchInput onSelect={handleSearchSelect} autoFocus />
            <div className="flex-1" />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                {messages.books.buttons.manualInput}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && resolvedBook && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-32 h-44 rounded-lg overflow-hidden shadow-md bg-muted flex items-center justify-center">
                {resolvedBook.cover ? (
                  <img
                    src={resolvedBook.cover}
                    alt={resolvedBook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-lg leading-tight">{resolvedBook.title}</p>
                <p className="text-sm text-muted-foreground">{resolvedBook.author}</p>
                <p className="text-sm text-muted-foreground">{resolvedBook.publisher}</p>
                {isLookingUp ? (
                  <p className="text-sm text-muted-foreground animate-pulse">페이지 조회 중...</p>
                ) : resolvedBook.totalPages ? (
                  <p className="text-sm text-muted-foreground">
                    {resolvedBook.totalPages} {messages.books.details.pagesUnit}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSubmitFromConfirm}
                disabled={createBookMutation.isPending || isLookingUp}
                className="w-full"
              >
                {createBookMutation.isPending
                  ? messages.common.buttons.saving
                  : messages.common.buttons.save}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep('form')}
                disabled={createBookMutation.isPending}
                className="w-full"
              >
                {messages.books.buttons.editBook}
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <BookForm
            selectedBook={resolvedBook}
            onSubmit={handleSubmitFromForm}
            isPending={createBookMutation.isPending}
          />
        )}
      </main>
    </div>
  );
}

function DesktopView() {
  const navigate = useNavigate();
  const createBookMutation = useCreateBook();
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null);

  async function handleSubmit(data: BookFormData) {
    try {
      const response = await createBookMutation.mutateAsync({
        title: data.title,
        author: data.author,
        cover_image_url: data.cover_image_url || null,
        total_pages: data.total_pages ? parseInt(data.total_pages) : null,
      });
      navigate(`/books/${response.reading_log.id}`);
    } catch {
      toast.error(messages.common.errors.failedToCreate);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{messages.books.pages.new}</h1>
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Link to="/">
                <Button variant="outline" size="sm">
                  {messages.common.buttons.cancel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <BookForm
          selectedBook={selectedBook}
          onSubmit={handleSubmit}
          isPending={createBookMutation.isPending}
          showSearch
          onSearchSelect={setSelectedBook}
        />
      </main>
    </div>
  );
}

export function BookNewPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileView /> : <DesktopView />;
}
