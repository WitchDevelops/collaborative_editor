'use client';

import { SignedIn, UserButton } from '@clerk/nextjs';
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { updateDocument } from '@/lib/actions/room.actions';

import { Editor } from '@/components/Editor/Editor';
import { Header } from '@/components/Header';
import { Loader } from '@/components/Loader';

import { ActiveCollaborators } from './ActiveCollaborators';
import { ShareModal } from './ShareModal';
import { Input } from './ui/input';

type CollaborativeRoomProps = {
  roomId: string;
  roomMetadata: RoomMetadata;
  users: User[];
  currentUserType: UserType;
};

export function CollaborativeRoom({
  roomId,
  roomMetadata,
  users,
  currentUserType,
}: CollaborativeRoomProps) {
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitleHandler = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      setLoading(true);

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if (updatedDocument) {
            setEditing(false);
          }
        }
      } catch (error) {
        console.log('Error notif:', error);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="flex size-full max-h-screen flex-1 flex-col items-center overflow-hidden">
          {/* Header */}
          <Header>
            {/* Title */}
            <div
              ref={containerRef}
              className="flex w-fit items-center justify-center gap-2"
            >
              {editing && !loading ? (
                <Input
                  type="email"
                  value={documentTitle}
                  ref={inputRef}
                  placeholder="Enter title"
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={(e) => updateTitleHandler(e)}
                  disabled={!editing}
                  className="xs:max-w-full min-w-[78px] border-none bg-transparent px-0 text-left text-base font-semibold leading-[24px] focus-visible:ring-0 focus-visible:ring-offset-0 disabled:text-black sm:text-xl md:text-center"
                />
              ) : (
                <>
                  <p className="line-clamp-1 border-dark-400 text-base font-semibold leading-[24px] sm:pl-0 sm:text-xl">
                    {documentTitle}
                  </p>
                </>
              )}

              {/* Edit title icon */}
              {currentUserType === 'editor' && !editing && (
                <Image
                  src="/assets/icons/edit.svg"
                  alt="edit"
                  width={24}
                  height={24}
                  onClick={() => setEditing(true)}
                  className="cursor-pointer"
                />
              )}

              {/* View only user indicator */}
              {currentUserType !== 'editor' && !editing && (
                <p className="rounded-md bg-dark-400/50 px-2 py-0.5 text-[12px] text-blue-100/50">
                  View only
                </p>
              )}

              {/* Saving title indicator */}
              {loading && <p className="text-sm text-gray-400">saving...</p>}
            </div>

            {/* Collaborators & Actions */}
            <div className="flex w-full flex-1 justify-end gap-2 sm:gap-3">
              <ActiveCollaborators />
              <ShareModal
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetadata.creatorId}
                currentUserType={currentUserType}
              />
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </Header>

          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
}
