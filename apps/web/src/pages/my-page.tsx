import { EmptyState } from '@/components/empty-state';
import {
  FriendListItemSkeleton,
  ProfileSectionSkeleton,
  RequestItemSkeleton,
} from '@/components/skeletons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useDeleteFriendship,
  useFriendsList,
  useProfile,
  useReceivedRequests,
  useRejectFriendRequest,
  useSearchUsers,
  useSendFriendRequest,
  useSentRequests,
  useUpdateProfile,
} from '@/hooks';
import { useAuth } from '@/hooks/use-auth';
import {
  BUTTON_LABELS,
  FIELD_LABELS,
  MESSAGES,
  MISC,
  PAGE_TITLES,
  PASSWORD_SETUP_LABELS,
  PLACEHOLDERS,
} from '@/lib/constants';
import type { PublicProfile, UpdateProfilePayload } from '@/types';
import { Inbox, Send, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type Tab = 'profile' | 'friends' | 'requests';

export function MyPage() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{PAGE_TITLES.MY_PAGE}</h1>
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                {BUTTON_LABELS.SIGN_OUT}
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
            {[
              { key: 'profile' as Tab, label: PAGE_TITLES.MY_PAGE },
              { key: 'friends' as Tab, label: PAGE_TITLES.FRIENDS },
              { key: 'requests' as Tab, label: PAGE_TITLES.FRIEND_REQUESTS },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'friends' && <FriendsSection />}
        {activeTab === 'requests' && <RequestsSection />}
      </main>
    </div>
  );
}

// =============================================================================
// PasswordDialog — 비밀번호 추가/변경 다이얼로그
// =============================================================================

interface PasswordDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'change';
}

function PasswordDialog({ open, onClose, mode }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { updatePassword } = useAuth();

  const handleSave = async () => {
    setError(null);

    if (password.length < 6) {
      setError(PASSWORD_SETUP_LABELS.MIN_LENGTH_ERROR);
      return;
    }
    if (password !== confirmPassword) {
      setError(PASSWORD_SETUP_LABELS.MISMATCH_ERROR);
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      toast.success(PASSWORD_SETUP_LABELS.SUCCESS);
      onClose();
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : '비밀번호 설정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 다이얼로그가 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open]);

  const title =
    mode === 'add' ? PASSWORD_SETUP_LABELS.ADD_TITLE : PASSWORD_SETUP_LABELS.CHANGE_TITLE;
  const description =
    mode === 'add'
      ? PASSWORD_SETUP_LABELS.ADD_DESCRIPTION
      : PASSWORD_SETUP_LABELS.CHANGE_DESCRIPTION;

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <label htmlFor="new-pw" className="text-sm font-medium">
              {PASSWORD_SETUP_LABELS.NEW_PASSWORD}
            </label>
            <Input
              id="new-pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={PASSWORD_SETUP_LABELS.PASSWORD_PLACEHOLDER}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-pw" className="text-sm font-medium">
              {PASSWORD_SETUP_LABELS.CONFIRM_PASSWORD}
            </label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={PASSWORD_SETUP_LABELS.CONFIRM_PLACEHOLDER}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            {PASSWORD_SETUP_LABELS.CANCEL}
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? PASSWORD_SETUP_LABELS.SAVING : PASSWORD_SETUP_LABELS.SAVE}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// ProfileSection
// =============================================================================

function ProfileSection() {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; mode: 'add' | 'change' }>({
    open: false,
    mode: 'add',
  });

  const { user } = useAuth();
  const hasPassword = user?.user_metadata?.has_password === true;

  const { control, handleSubmit, reset } = useForm<UpdateProfilePayload>({
    defaultValues: {
      nickname: '',
      bio: '',
      avatar_url: '',
    },
  });

  const startEditing = () => {
    if (profile) {
      reset({
        nickname: profile.nickname,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setIsEditing(true);
  };

  const onSubmit = async (data: UpdateProfilePayload) => {
    try {
      await updateProfileMutation.mutateAsync({
        nickname: data.nickname || undefined,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
      });
      setIsEditing(false);
      toast.success(MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(MESSAGES.FAILED_TO_SAVE);
    }
  };

  if (isLoading) return <ProfileSectionSkeleton />;

  if (!profile) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{MISC.MY_PAGE}</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              {BUTTON_LABELS.EDIT_PROFILE}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Controller
                name="nickname"
                control={control}
                rules={{
                  required: true,
                  minLength: { value: 2, message: MESSAGES.NICKNAME_LENGTH_ERROR },
                  maxLength: { value: 20, message: MESSAGES.NICKNAME_LENGTH_ERROR },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="nickname">
                      {FIELD_LABELS.NICKNAME} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="nickname"
                      value={field.value ?? ''}
                      placeholder={PLACEHOLDERS.NICKNAME}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="avatar_url"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="avatar_url">{FIELD_LABELS.AVATAR_URL}</FieldLabel>
                    <Input
                      {...field}
                      id="avatar_url"
                      type="url"
                      value={field.value ?? ''}
                      placeholder={PLACEHOLDERS.AVATAR_URL}
                    />
                    {field.value && (
                      <img
                        src={field.value}
                        alt=""
                        className="mt-2 w-12 h-12 rounded-full object-cover border"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="bio">{FIELD_LABELS.BIO}</FieldLabel>
                    <Textarea
                      {...field}
                      id="bio"
                      rows={3}
                      value={field.value ?? ''}
                      placeholder={PLACEHOLDERS.BIO}
                    />
                  </Field>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={updateProfileMutation.isPending}
                >
                  {BUTTON_LABELS.CANCEL}
                </Button>
                <Button type="submit" size="sm" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? BUTTON_LABELS.SAVING : BUTTON_LABELS.SAVE}
                </Button>
              </div>
            </FieldGroup>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.nickname}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-bold">
                  {profile.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{profile.nickname}</h2>
                {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
              </div>
            </div>

            {/* 비밀번호 관리 */}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{PASSWORD_SETUP_LABELS.NEW_PASSWORD}</p>
                <p className="text-xs text-muted-foreground">
                  {hasPassword
                    ? '비밀번호가 설정되어 있습니다.'
                    : '비밀번호가 설정되어 있지 않습니다.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPasswordDialog({ open: true, mode: hasPassword ? 'change' : 'add' })
                }
              >
                {hasPassword ? PASSWORD_SETUP_LABELS.CHANGE_BTN : PASSWORD_SETUP_LABELS.ADD_BTN}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <PasswordDialog
        open={passwordDialog.open}
        mode={passwordDialog.mode}
        onClose={() => setPasswordDialog(prev => ({ ...prev, open: false }))}
      />
    </Card>
  );
}

function FriendsSection() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFriendsList();
  const deleteFriendshipMutation = useDeleteFriendship();
  const blockUserMutation = useBlockUser();

  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'remove' | 'block';
    friendshipId: string;
    userId: string;
    nickname: string;
  } | null>(null);

  const friends = data?.pages.flatMap(page => page.data) ?? [];

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    try {
      if (confirmDialog.type === 'remove') {
        await deleteFriendshipMutation.mutateAsync(confirmDialog.friendshipId);
      } else {
        await blockUserMutation.mutateAsync(confirmDialog.userId);
      }
      setConfirmDialog(null);
    } catch (error) {
      console.error('Failed:', error);
      toast.error(MESSAGES.FAILED_TO_DELETE);
    }
  };

  const sendRequestMutation = useSendFriendRequest();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user: PublicProfile) => {
    setSelectedUser(user);
    setSearchTerm(user.nickname);
    setShowResults(false);
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    try {
      await sendRequestMutation.mutateAsync(selectedUser.id);
      setSearchTerm('');
      setSelectedUser(null);
      setShowAddFriend(false);
      toast.success(MESSAGES.FRIEND_REQUEST_SENT);
    } catch (error) {
      console.error('Failed to send request:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  if (isLoading) {
    return <FriendListItemSkeleton />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">
              {MISC.FRIEND_LIST}
              <span className="text-muted-foreground font-normal ml-2">
                ({data?.pages[0]?.meta.total ?? 0})
              </span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddFriend(!showAddFriend)}>
              {showAddFriend ? BUTTON_LABELS.CANCEL : BUTTON_LABELS.SEND_REQUEST}
            </Button>
          </div>
        </CardHeader>

        {showAddFriend && (
          <CardContent className="pt-0 pb-4">
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1" ref={searchContainerRef}>
                  <Input
                    placeholder={PLACEHOLDERS.SEARCH_NICKNAME}
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setSelectedUser(null);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="text-sm"
                  />
                  {showResults && debouncedTerm.length >= 2 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          {MESSAGES.LOADING}
                        </div>
                      ) : !searchResults?.data.length ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          {MESSAGES.NO_SEARCH_RESULTS}
                        </div>
                      ) : (
                        searchResults.data.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left"
                            onClick={() => handleSelectUser(user)}
                          >
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.nickname}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                                {user.nickname.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{user.nickname}</p>
                              {user.bio && (
                                <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {showResults && debouncedTerm.length > 0 && debouncedTerm.length < 2 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg">
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        {MESSAGES.SEARCH_MIN_LENGTH}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSendRequest}
                  disabled={!selectedUser || sendRequestMutation.isPending}
                >
                  {sendRequestMutation.isPending
                    ? BUTTON_LABELS.SENDING
                    : BUTTON_LABELS.SEND_REQUEST}
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className={showAddFriend ? 'pt-0' : 'pt-0'}>
          {friends.length === 0 ? (
            <EmptyState
              icon={<Users size={48} strokeWidth={1} />}
              message={MESSAGES.NO_FRIENDS}
              action={{
                label: BUTTON_LABELS.SEND_REQUEST,
                onClick: () => setShowAddFriend(true),
              }}
            />
          ) : (
            <div className="space-y-1">
              {friends.map(item => (
                <div
                  key={item.friendship_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {item.friend.avatar_url ? (
                    <img
                      src={item.friend.avatar_url}
                      alt={item.friend.nickname}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {item.friend.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.friend.nickname}</p>
                    {item.friend.bio && (
                      <p className="text-xs text-muted-foreground truncate">{item.friend.bio}</p>
                    )}
                  </div>
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          type: 'remove',
                          friendshipId: item.friendship_id,
                          userId: item.friend.id,
                          nickname: item.friend.nickname,
                        })
                      }
                    >
                      {BUTTON_LABELS.REMOVE}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          type: 'block',
                          friendshipId: item.friendship_id,
                          userId: item.friend.id,
                          nickname: item.friend.nickname,
                        })
                      }
                    >
                      {BUTTON_LABELS.BLOCK}
                    </Button>
                  </div>
                </div>
              ))}

              {hasNextPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? MESSAGES.LOADING : BUTTON_LABELS.LOAD_MORE}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDialog} onOpenChange={open => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {confirmDialog?.type === 'remove' ? BUTTON_LABELS.REMOVE_FRIEND : BUTTON_LABELS.BLOCK}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {confirmDialog?.type === 'remove'
                ? MESSAGES.REMOVE_FRIEND_CONFIRMATION
                : MESSAGES.BLOCK_CONFIRMATION}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
              {BUTTON_LABELS.CANCEL}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={deleteFriendshipMutation.isPending || blockUserMutation.isPending}
            >
              {deleteFriendshipMutation.isPending || blockUserMutation.isPending
                ? MESSAGES.LOADING
                : confirmDialog?.type === 'remove'
                  ? BUTTON_LABELS.REMOVE
                  : BUTTON_LABELS.BLOCK}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestsSection() {
  const {
    data: receivedData,
    fetchNextPage: fetchMoreReceived,
    hasNextPage: hasMoreReceived,
    isFetchingNextPage: isFetchingMoreReceived,
    isLoading: isLoadingReceived,
  } = useReceivedRequests();

  const {
    data: sentData,
    fetchNextPage: fetchMoreSent,
    hasNextPage: hasMoreSent,
    isFetchingNextPage: isFetchingMoreSent,
    isLoading: isLoadingSent,
  } = useSentRequests();

  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const deleteMutation = useDeleteFriendship();

  const received = receivedData?.pages.flatMap(page => page.data) ?? [];
  const sent = sentData?.pages.flatMap(page => page.data) ?? [];

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptMutation.mutateAsync(friendshipId);
    } catch (error) {
      console.error('Failed to accept:', error);
      toast.error(MESSAGES.FAILED_TO_SAVE);
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      await rejectMutation.mutateAsync(friendshipId);
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error(MESSAGES.FAILED_TO_SAVE);
    }
  };

  const handleCancelSent = async (friendshipId: string) => {
    try {
      await deleteMutation.mutateAsync(friendshipId);
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast.error(MESSAGES.FAILED_TO_DELETE);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {MISC.RECEIVED_REQUESTS}
            <span className="text-muted-foreground font-normal ml-2">
              ({receivedData?.pages[0]?.meta.total ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingReceived ? (
            <div className="space-y-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <RequestItemSkeleton key={i} />
              ))}
            </div>
          ) : received.length === 0 ? (
            <EmptyState
              icon={<Inbox size={48} strokeWidth={1} />}
              message={MESSAGES.NO_RECEIVED_REQUESTS}
            />
          ) : (
            <div className="space-y-1">
              {received.map(item => (
                <div
                  key={item.friendship_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {item.requester.avatar_url ? (
                    <img
                      src={item.requester.avatar_url}
                      alt={item.requester.nickname}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {item.requester.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.requester.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.requested_at.split('T')[0]}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(item.friendship_id)}
                      disabled={acceptMutation.isPending}
                    >
                      {acceptMutation.isPending ? BUTTON_LABELS.ACCEPTING : BUTTON_LABELS.ACCEPT}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(item.friendship_id)}
                      disabled={rejectMutation.isPending}
                    >
                      {BUTTON_LABELS.REJECT}
                    </Button>
                  </div>
                </div>
              ))}

              {hasMoreReceived && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => fetchMoreReceived()}
                  disabled={isFetchingMoreReceived}
                >
                  {isFetchingMoreReceived ? MESSAGES.LOADING : BUTTON_LABELS.LOAD_MORE}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {MISC.SENT_REQUESTS}
            <span className="text-muted-foreground font-normal ml-2">
              ({sentData?.pages[0]?.meta.total ?? 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingSent ? (
            <div className="space-y-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <RequestItemSkeleton key={i} />
              ))}
            </div>
          ) : sent.length === 0 ? (
            <EmptyState
              icon={<Send size={48} strokeWidth={1} />}
              message={MESSAGES.NO_SENT_REQUESTS}
            />
          ) : (
            <div className="space-y-1">
              {sent.map(item => (
                <div
                  key={item.friendship_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {item.addressee.avatar_url ? (
                    <img
                      src={item.addressee.avatar_url}
                      alt={item.addressee.nickname}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {item.addressee.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.addressee.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.requested_at.split('T')[0]}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSent(item.friendship_id)}
                    disabled={deleteMutation.isPending}
                  >
                    {BUTTON_LABELS.CANCEL_REQUEST}
                  </Button>
                </div>
              ))}

              {hasMoreSent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => fetchMoreSent()}
                  disabled={isFetchingMoreSent}
                >
                  {isFetchingMoreSent ? MESSAGES.LOADING : BUTTON_LABELS.LOAD_MORE}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
