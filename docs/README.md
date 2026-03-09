# VFS Package Features

This document describes all features and functionalities provided by the `@deessejs/vfs` package.

## Table of Contents

1. [Core Data Structures](#core-data-structures)
2. [Helper Functions](#helper-functions)
3. [Path Utilities](#path-utilities)
4. [Core VFS API](#core-vfs-api)
5. [Lock System](#lock-system)
6. [File System Events](#file-system-events)
7. [Shell Module](#shell-module)

> Note: The VFS uses [Maybe](https://github.com/nesalia-inc/fp) and [Result](https://github.com/nesalia-inc/fp) monads from the `@nesalia/fp` package for error handling.

---

## Core Data Structures

The VFS package provides TypeScript types for representing files and directories in a virtual file system.

### SizeInBytes

```typescript
type SizeInBytes = number
```

A type representing the size of a file in bytes.

### FileSystemNode

```typescript
type FileSystemNode = {
  name: string
  path: string
  isDirectory: boolean
  createdAt: Date
  modifiedAt: Date
}
```

The base type for both files and directories.

### File

```typescript
type File = FileSystemNode & {
  isDirectory: false
  content: string
  size: SizeInBytes
}
```

A file represents a regular file in the virtual file system with its content stored in memory.

### Directory

```typescript
type Directory = FileSystemNode & {
  isDirectory: true
  children: FileSystemItem[]
}
```

A directory contains a collection of files and subdirectories.

### FileSystemItem

```typescript
type FileSystemItem = File | Directory
```

Union type representing either a file or a directory.

---

## Helper Functions

Factory functions for creating File and Directory objects.

### file()

```typescript
const file = (config: FileConfig): File

type FileConfig = {
  name: string
  content?: string
}
```

Creates a new file with auto-generated timestamps.

```typescript
const myFile = file({
  name: 'main.ts',
  content: 'console.log("hello")'
})
```

### folder()

```typescript
const folder = (config: FolderConfig): Directory

type FolderConfig = {
  name: string
  children?: Record<string, File | Directory>
}
```

Creates a new directory with optional children.

```typescript
const myFolder = folder({
  name: 'src',
  children: {
    'main.ts': file({ name: 'main.ts', content: '...' })
  }
})
```

### Type Guards

| Function | Description |
|----------|-------------|
| `isFile(item)` | Returns true if item is a File |
| `isDirectory(item)` | Returns true if item is a Directory |

---

## Path Utilities

Path manipulation and validation functions.

### Constants

```typescript
const PATH_SEPARATOR = '/'
const MAX_PATH_LENGTH = 4096
```

### Functions

| Function | Description |
|----------|-------------|
| `resolve(...paths)` | Resolves a sequence of paths |
| `join(...parts)` | Joins path parts together |
| `dirname(path)` | Returns directory name |
| `basename(path)` | Returns base name |
| `extname(path)` | Returns file extension |
| `normalize(path)` | Normalizes the path |
| `isAbsolute(path)` | Checks if path is absolute |

### Usage Examples

```typescript
join('src', 'utils', 'helpers.ts')
// → 'src/utils/helpers.ts'

basename('/src/utils/helpers.ts')
// → 'helpers.ts'

dirname('/src/utils/helpers.ts')
// → '/src/utils'

extname('/src/utils/helpers.ts')
// → '.ts'

normalize('/src/../src/utils/./helpers.ts')
// → '/src/utils/helpers.ts'

isAbsolute('/src/utils')
// → true
```

### Path Validation

The VFS includes security measures against path traversal attacks:

- No null bytes in paths
- No traversal beyond root (`../../etc/passwd`)
- No invalid characters
- Path length validation
- Windows support (drive letters, backslashes)

---

## Core VFS API

The main virtual file system operations.

### Factory

```typescript
const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})
```

### Operations

| Method | Signature | Returns |
|--------|-----------|---------|
| `readFile` | `(path: string) => Result<string, NotFound \| NotFile>` | File content |
| `writeFile` | `(path: string, content: string) => Result<void, WriteError>` | Success or error |
| `mkdir` | `(path: string) => Result<void, MkdirError>` | Success or error |
| `rm` | `(path: string) => Result<void, RmError>` | Success or error |
| `rename` | `(oldPath: string, newPath: string) => Result<void, RenameError>` | Success or error |
| `copy` | `(src: string, dest: string) => Result<void, CopyError>` | Success or error |
| `move` | `(src: string, dest: string) => Result<void, MoveError>` | Success or error |
| `readDir` | `(path: string) => Result<string[], NotFound \| NotDirectory>` | Directory contents |
| `exists` | `(path: string) => boolean` | Boolean |
| `isFile` | `(path: string) => boolean` | Boolean |
| `isDirectory` | `(path: string) => boolean` | Boolean |
| `stat` | `(path: string) => Result<FileNode, NotFound>` | File metadata |
| `getCwd` | `() => string` | Current directory |
| `setCwd` | `(path: string) => Result<void, SetCwdError>` | Success or error |

### Error Types

All errors use discriminated unions for exhaustive checking:

```typescript
type FSError =
  | { type: 'not_found'; path: string }
  | { type: 'not_file'; path: string }
  | { type: 'not_directory'; path: string }
  | { type: 'already_exists'; path: string }
  | { type: 'not_empty'; path: string }
  | { type: 'invalid_path'; path: string; reason: string }
  | { type: 'permission_denied'; path: string; reason: string }
  | { type: 'path_too_long'; path: string }
  | { type: 'circular_reference'; path: string }
```

### Usage Example

```typescript
const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})

// Create files and directories
vfs.mkdir('/src')
vfs.writeFile('/src/main.ts', 'console.log("hello")')

// Read file
const content = vfs.readFile('/src/main.ts')
if (isOk(content)) {
  console.log(content.value)
}

// Error handling
const result = vfs.readFile('/missing.ts')
if (isErr(result)) {
  switch (result.error.type) {
    case 'not_found':
      console.log('File not found')
      break
    case 'not_file':
      console.log('Path is a directory')
      break
  }
}
```

---

## Lock System

Prevents modification, deletion, or renaming of files and directories.

### Types

```typescript
type LockPermissions = {
  write?: boolean      // Block writeFile
  delete?: boolean     // Block rm
  rename?: boolean     // Block rename
  lock?: boolean       // Block adding new locks
}

type Lock = {
  owner: string
  permissions: LockPermissions
  reason?: string
  createdAt: number
}

type LockError =
  | { type: 'locked'; lock: Lock }
  | { type: 'not_owner'; lock: Lock }
  | { type: 'already_locked'; lock: Lock }
  | { type: 'force_required'; lock: Lock }
```

### API

| Method | Description |
|--------|-------------|
| `lock(path, owner, permissions?, reason?)` | Applies a lock to a path |
| `unlock(path, owner?, force?)` | Removes a lock |
| `getLock(path)` | Gets the current lock |

### Usage Example

```typescript
// Lock a file
vfs.lock('/src/main.ts', 'user1', { write: true }, 'Working on it')

// Attempt to write (will fail)
const result = vfs.writeFile('/src/main.ts', 'new content')
if (isErr(result) && result.error.type === 'locked') {
  console.log('File is locked by:', result.error.lock.owner)
}

// Unlock
vfs.unlock('/src/main.ts', 'user1')
```

---

## File System Events

Real-time notifications when the file system changes.

### Event Types

```typescript
type FSEventKind =
  | { kind: 'create'; path: string }
  | { kind: 'update'; path: string; oldContent: string; newContent: string }
  | { kind: 'delete'; path: string }
  | { kind: 'mkdir'; path: string }
  | { kind: 'rename'; path: string; oldPath: string; newPath: string }
  | { kind: 'lock'; path: string; lock: Lock }
  | { kind: 'unlock'; path: string }

type FSEvent = FSEventKind & {
  timestamp: number
  actor?: string
}
```

### Watch API

```typescript
const unsubscribe = vfs.watch(
  '/src',
  { recursive: true, events: ['create', 'update', 'delete'] },
  (event) => {
    console.log(event.kind, event.path)
  }
)

// Stop watching
unsubscribe()
```

---

## Shell Module

A command-line shell interface built on top of VFS.

### Factory

```typescript
const shell = createShell({ vfs })
```

### Commands

| Command | Description |
|---------|-------------|
| `cd <path>` | Change directory |
| `pwd` | Print working directory |
| `ls [path]` | List directory contents |
| `mkdir <path>` | Create directory |
| `touch <path>` | Create empty file |
| `rm <path>` | Remove file or directory |
| `cat <path>` | Display file contents |
| `cp <src> <dest>` | Copy file or directory |
| `mv <src> <dest>` | Move/rename file or directory |
| `echo <text>` | Print text to output |

### Usage Example

```typescript
const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})
const shell = createShell({ vfs })

shell.exec('mkdir src')
shell.exec('touch src/main.ts')
shell.exec('echo "hello" > src/main.ts')
shell.exec('cat src/main.ts')  // Outputs: hello
shell.exec('ls src')           // Outputs: main.ts
```

---

## Design Principles

1. **Pure TypeScript** - No external dependencies
2. **No Classes** - Functions only
3. **Maybe/Result Monads** - From `@nesalia/fp` package
4. **Path Validation** - Security against traversal attacks
5. **Cross-Platform** - Works in Node.js and browser
6. **Event-Driven** - Watch for changes
7. **Separation of Concerns** - VFS is pure, Shell interprets commands
