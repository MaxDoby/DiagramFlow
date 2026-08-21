import type { FolderListResponse } from '@diagram-flow/contracts';
import { Folder, FolderPlus, LayoutGrid } from 'lucide-react';

type FolderNavigationProps = {
  folders: FolderListResponse;
  selectedFolderId?: string;
  isCreateFolderOpen: boolean;
  onSelectFolder: (folderId?: string) => void;
  onToggleCreateFolder: () => void;
};

export const FolderNavigation = ({
  folders,
  selectedFolderId,
  isCreateFolderOpen,
  onSelectFolder,
  onToggleCreateFolder,
}: FolderNavigationProps) => (
  <nav
    className="mt-5 flex gap-2 overflow-x-auto pb-1"
    aria-label="Diagram folders"
  >
    <button
      className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
      type="button"
      onClick={() => onSelectFolder()}
      aria-pressed={!selectedFolderId}
    >
      <LayoutGrid className="size-4" aria-hidden="true" />
      All diagrams
    </button>

    {folders.map((folder) => (
      <button
        className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
        type="button"
        key={folder.id}
        onClick={() => onSelectFolder(folder.id)}
        aria-pressed={selectedFolderId === folder.id}
      >
        <Folder className="size-4" aria-hidden="true" />
        {folder.name}
        <span className="text-xs opacity-70">{folder.diagramCount}</span>
      </button>
    ))}

    <button
      className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-dashed border-zinc-400 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      type="button"
      onClick={onToggleCreateFolder}
      aria-expanded={isCreateFolderOpen}
    >
      <FolderPlus className="size-4" aria-hidden="true" />
      New folder
    </button>
  </nav>
);
