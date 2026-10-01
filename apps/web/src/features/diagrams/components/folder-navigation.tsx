import type { FolderListResponse } from '@diagram-flow/contracts';
import { Folder, FolderPlus, LayoutGrid, Trash2 } from 'lucide-react';

type FolderNavigationProps = {
  folders: FolderListResponse;
  selectedFolderId?: string;
  isCreateFolderOpen: boolean;
  onSelectFolder: (folderId?: string) => void;
  onRequestDelete: (folder: FolderListResponse[number]) => void;
  onToggleCreateFolder: () => void;
};

export const FolderNavigation = ({
  folders,
  selectedFolderId,
  isCreateFolderOpen,
  onSelectFolder,
  onRequestDelete,
  onToggleCreateFolder,
}: FolderNavigationProps) => (
  <nav
    className="mt-5 flex gap-2 overflow-x-auto pb-1"
    aria-label="Diagram folders"
  >
    <button
      className="flex h-10 shrink-0 items-center gap-2 rounded-md
        border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
      type="button"
      onClick={() => onSelectFolder()}
      aria-pressed={!selectedFolderId}
    >
      <LayoutGrid className="size-4" aria-hidden="true" />
      All diagrams
    </button>

    {folders.map((folder) => (
      <div className="flex shrink-0" key={folder.id}>
        <button
          className="flex h-10 items-center gap-2 rounded-l-md
            border border-r-0 border-zinc-300 bg-white px-3 text-sm
            font-medium text-zinc-700 hover:bg-zinc-100 aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white"
          type="button"
          onClick={() => onSelectFolder(folder.id)}
          aria-pressed={selectedFolderId === folder.id}
        >
          <Folder className="size-4" aria-hidden="true" />
          {folder.name}
          <span className="text-xs opacity-70">{folder.diagramCount}</span>
        </button>

        <button
          className="flex size-10 items-center justify-center
            rounded-r-md border border-zinc-300 bg-white text-zinc-500
            hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          type="button"
          onClick={() => onRequestDelete(folder)}
          aria-label={`Delete folder ${folder.name}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    ))}

    <button
      className="flex h-10 shrink-0 items-center gap-2 rounded-md
        border border-dashed border-zinc-400 bg-white px-3 text-sm
        font-medium text-zinc-700 hover:bg-zinc-100"
      type="button"
      onClick={onToggleCreateFolder}
      aria-expanded={isCreateFolderOpen}
    >
      <FolderPlus className="size-4" aria-hidden="true" />
      New folder
    </button>
  </nav>
);
