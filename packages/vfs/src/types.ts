export type SizeInBytes = number;

export type FileSystemNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  createdAt: string;
  modifiedAt: string;
};

export type File = FileSystemNode & {
  isDirectory: false;
  content: string;
  size: SizeInBytes;
};

export type Directory = FileSystemNode & {
  isDirectory: true;
  children: FileSystemNode[];
};

export type FileSystemItem = File | Directory;

/**
 * Virtual file system interface.
 * This defines the API contract for implementing a virtual file system.
 */
export interface FileSystem {
  root: Directory;
  exists(path: string): boolean;
  get(path: string): FileSystemItem | null;
  mkdir(path: string): Directory;
  touch(path: string, content?: string): File;
  rm(path: string): boolean;
  read(path: string): string | null;
  write(path: string, content: string): File;
}

export function isFile(item: FileSystemItem): item is File {
  return !item.isDirectory;
}

export function isDirectory(item: FileSystemItem): item is Directory {
  return item.isDirectory;
}
