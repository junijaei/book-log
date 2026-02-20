import { messages } from '@/constants/messages';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';

export function BookCardSkeleton() {
  return (
    <div className="flex gap-4 px-4 py-3.5 rounded-xl border bg-card">
      {/* 표지 */}
      <Skeleton className="w-20 h-28 rounded shrink-0" />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
        {/* 제목 + 평점 */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        {/* 저자 + 상태 배지 */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        {/* 진행률 바 */}
        <div className="flex items-center justify-between gap-6">
          <Skeleton className="h-2 w-1/3 rounded-full mt-0.5" />
          <Skeleton className="h-2 w-2/3 rounded-full mt-0.5" />
        </div>
        {/* 메타데이터 칩 */}
        <div className="flex items-center gap-3 mt-auto pt-3 border-t">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-24 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function BookListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* COMPACT BOOK HEADER */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-24 rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0" />
            </div>
            {/* Inline metadata row */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* QUOTES SECTION */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-l-2 border-muted pl-6 py-4 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProfileSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{messages.profile.pages.myPage}</CardTitle>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{messages.auth.passwordSetup.newPasswordLabel}</p>
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FriendListItemSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{messages.friends.sections.friendList}</CardTitle>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RequestItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

export function BookEditSkeleton() {
  return (
    <div className="space-y-8">
      {/* SECTION 1: Book Information */}
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Reading Record */}
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Quotes */}
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Add quote form skeleton */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-28 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>

          {/* Existing quotes skeleton */}
          <div className="space-y-4 pt-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border-l-2 border-muted pl-4 py-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
