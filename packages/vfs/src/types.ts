export type SizeInBytes = number;

/**
 * Base type for file system nodes (files and directories).
 */
export type FileSystemNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
};

/**
 * File type representing a file in the virtual file system.
 */
export type File = FileSystemNode & {
  isDirectory: false;
  content: string;
  size: SizeInBytes;
};

/**
 * Directory type representing a directory in the virtual file system.
 */
export type Directory = FileSystemNode & {
  isDirectory: true;
  children: FileSystemItem[];
};

/**
 * Union type for file system items (files or directories).
 */
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
  rm(path: string): void;
  read(path: string): string | null;
  write(path: string, content: string): File;
}

/**
 * Type guard to check if a file system node is a file.
 */
export function isFile(item: FileSystemNode): item is File {
  return !item.isDirectory;
}

/**
 * Type guard to check if a file system node is a directory.
 */
export function isDirectory(item: FileSystemNode): item is Directory {
  return item.isDirectory;
}
