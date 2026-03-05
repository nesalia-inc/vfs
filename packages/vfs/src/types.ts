export type FileSystemNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
};

export type File = FileSystemNode & {
  isDirectory: false;
  content: string;
  size: number;
};

export type Directory = FileSystemNode & {
  isDirectory: true;
  children: FileSystemNode[];
};

export type FileSystemItem = File | Directory;

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
