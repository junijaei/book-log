import { BookCover } from '@/components/book-cover';
import { BookSearchInput } from '@/components/book-search-input';
import { FieldDrawer } from '@/components/field-drawer';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { messages } from '@/constants/messages';
import { useBookLookup, useCreateBook, useIsMobile } from '@/hooks';
import { getVisibilityLabel } from '@/lib/constants';
import type { AladinBook, BookFormData, Visibility } from '@/types';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type MobileStep = 'search' | 'confirm' | 'form';

const VISIBILITIES: Visibility[] = ['public', 'friends', 'private'];

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
                    !value || parseInt(value) > 0 || messages.books.messages.invalidPageCount,
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
  const router = useRouter();
  const createBookMutation = useCreateBook();
  const [step, setStep] = useState<MobileStep>('search');
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [visibilityOpen, setVisibilityOpen] = useState(false);

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
        visibility,
      });
      void navigate({ to: '/books/$id', params: { id: response.reading_log.id } });
    } catch {
      toast.error(messages.common.errors.failedToCreate);
    }
  }

  async function handleSubmitFromForm(data: BookFormData) {
    try {
      const response = await createBookMutation.mutateAsync({
        title: data.title,
        author: data.author,
        cover_image_url: data.cover_image_url || null,
        total_pages: data.total_pages ? parseInt(data.total_pages) : null,
      });
      void navigate({ to: '/books/$id', params: { id: response.reading_log.id } });
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
      <PageHeader
        maxWidth="max-w-2xl"
        left={
          step !== 'search' ? (
            <Button variant="ghost" className="px-0" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              {messages.common.buttons.back}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {messages.common.buttons.cancel}
            </Button>
          )
        }
      />

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
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {messages.books.messages.lookingUpPages}
                  </p>
                ) : resolvedBook.totalPages ? (
                  <p className="text-sm text-muted-foreground">
                    {resolvedBook.totalPages} {messages.books.details.pagesUnit}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground flex-1">
                {messages.books.fields.visibility}
              </p>
              <button
                type="button"
                onClick={() => setVisibilityOpen(true)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Badge>{getVisibilityLabel(visibility)}</Badge>
              </button>
            </div>
            <FieldDrawer
              open={visibilityOpen}
              onOpenChange={setVisibilityOpen}
              title={messages.books.fields.visibility}
            >
              <div className="space-y-1">
                {VISIBILITIES.map(v => (
                  <button
                    key={v}
                    type="button"
                    className={
                      'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors' +
                      (visibility === v ? ' bg-primary/10 text-primary' : ' hover:bg-muted')
                    }
                    onClick={() => {
                      setVisibility(v);
                      setVisibilityOpen(false);
                    }}
                  >
                    {getVisibilityLabel(v)}
                  </button>
                ))}
              </div>
            </FieldDrawer>

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
  const router = useRouter();
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
      void navigate({ to: '/books/$id', params: { id: response.reading_log.id } });
    } catch {
      toast.error(messages.common.errors.failedToCreate);
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        maxWidth="max-w-2xl"
        left={
          <Button variant="ghost" size="sm" className="px-0" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            {messages.common.buttons.cancel}
          </Button>
        }
      />

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
