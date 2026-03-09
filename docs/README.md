# VFS Package Features

This document describes all features and functionalities provided by the `@deessejs/vfs` package.

## Table of Contents

1. [Installation](#installation)
2. [Core Data Structures](#core-data-structures)
3. [Helper Functions](#helper-functions)
4. [Path Utilities](#path-utilities)
5. [Core VFS API](#core-vfs-api)
6. [Safety & Policies](#safety--policies)
7. [Lock System](#lock-system)
8. [File System Events](#file-system-events)
9. [Shell Module](#shell-module)
10. [Design Principles](#design-principles)
11. [Planned Features](#planned-features)

> Note: The VFS uses [Maybe](https://github.com/nesalia-inc/fp) and [Result](https://github.com/nesalia-inc/fp) monads from the `@deessejs/core` package for error handling.

---

## Installation

```bash
pnpm add @deessejs/vfs
```

```typescript
import { File, Directory, createFileSystem } from '@deessejs/vfs';
```

---

## Core Data Structures

The VFS package provides TypeScript types for representing files and directories in a virtual file system.

### SizeInBytes

```typescript
type SizeInBytes = number
```

A type representing the size of a file in bytes. The size is stored (not computed on every access) for performance. The VFS automatically maintains this value when file content changes.

### FileSystemNode

```typescript
type FileSystemNode = {
  name: string
  createdAt: Date
  modifiedAt: Date
}
```

The base type for both files and directories. Note: the `path` is derived from the tree structure, not stored in each node, to avoid denormalization.

### File

```typescript
type File = FileSystemNode & {
  content: string | Uint8Array
  size: SizeInBytes
}
```

A file represents a regular file in the virtual file system. The content can be either:
- `string` - For text files (default, UTF-16 internally)
- `Uint8Array` - For binary files (images, executables, etc.)

> **Note:** The VFS automatically maintains the `size` property when content changes.

### Directory

```typescript
type Directory = FileSystemNode & {
  children: Record<string, FileSystemItem>
}
```

A directory contains a collection of files and subdirectories. Using `Record` provides O(1) lookup by name.

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
  content?: string | Uint8Array
}
```

Creates a new file with auto-generated timestamps and calculated size.

```typescript
const myFile = file({
  name: 'main.ts',
  content: 'console.log("hello")'
})

// Binary file
const imageFile = file({
  name: 'image.png',
  content: new Uint8Array([0x89, 0x50, 0x4E, 0x47, ...])
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

Path manipulation and validation functions. All functions work with Unix-style paths (`/`) and automatically handle Windows paths.

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
- Windows support: converts backslashes to forward slashes, handles drive letters

---

## Core VFS API

The main virtual file system operations. All operations use the `@deessejs/core` Result monad for error handling.

### Factory

```typescript
const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})
```

### Operations

All methods that can fail return a `Result`:

| Method | Signature | Returns |
|--------|-----------|---------|
| `readText` | `(path: string) => Result<string, FSError>` | File content as string |
| `readBinary` | `(path: string) => Result<Uint8Array, FSError>` | File content as binary |
| `read` | `(path: string) => Result<File, FSError>` | Full file node with content |
| `writeFile` | `(path: string, content: string | Uint8Array) => Result<File, FSError>` | Created/updated file |
| `mkdir` | `(path: string, options?: { recursive?: boolean }) => Result<Directory, FSError>` | Created directory |
| `rm` | `(path: string) => Result<void, FSError>` | Success |
| `rename` | `(oldPath: string, newPath: string) => Result<void, FSError>` | Success |
| `copy` | `(src: string, dest: string, options?: { mode?: OverwriteMode }) => Result<void, FSError>` | Success |
| `move` | `(src: string, dest: string, options?: { mode?: OverwriteMode }) => Result<void, FSError>` | Success |
| `readDir` | `(path: string) => Result<string[], FSError>` | Directory entries |
| `stat` | `(path: string) => Result<FileSystemItem, FSError>` | Node at path |
| `setCwd` | `(path: string) => Result<void, FSError>` | Success |

Methods that return boolean for simple checks:

| Method | Signature | Returns |
|--------|-----------|---------|
| `exists` | `(path: string) => boolean` | Boolean |
| `isFile` | `(path: string) => boolean` | Boolean |
| `isDirectory` | `(path: string) => boolean` | Boolean |
| `getCwd` | `() => string` | Current directory |

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
import { createFileSystem, folder, isOk, isErr } from '@deessejs/vfs';

const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})

// Create files and directories
const mkdirResult = vfs.mkdir('/src', { recursive: true })
if (isErr(mkdirResult)) {
  console.error(mkdirResult.error)
  return
}

const writeResult = vfs.writeFile('/src/main.ts', 'console.log("hello")')
if (isErr(writeResult)) {
  console.error(writeResult.error)
  return
}

// Read text file
const readResult = vfs.readText('/src/main.ts')
if (isOk(readResult)) {
  console.log(readResult.value) // 'console.log("hello")'
}

// Read binary file
const binaryResult = vfs.readBinary('/src/image.png')
if (isOk(binaryResult)) {
  console.log(binaryResult.value.length) // byte length
}

// Error handling with exhaustive checking
const result = vfs.readFile('/missing.ts')
if (isErr(result)) {
  switch (result.error.type) {
    case 'not_found':
      console.log('File not found:', result.error.path)
      break
    case 'not_file':
      console.log('Path is a directory:', result.error.path)
      break
    // TypeScript ensures all cases are handled
  }
}
```

---

## Safety & Policies

This section defines the default behaviors and safety mechanisms of the VFS.

### Overwrite Policy

By default, operations that could overwrite existing files **fail** to prevent accidental data loss.

```typescript
type OverwriteMode = 'fail' | 'replace' | 'merge'
```

- **`fail`** (default): Throws an error if destination exists
- **`replace`**: Overwrites the destination entirely
- **`merge`** (directories only): Recursively merges children
  - Files with the same name are replaced
  - Subdirectories are merged recursively
  - New files/directories are added

```typescript
// This will fail if '/dest' already exists
vfs.copy('/src', '/dest')

// Explicitly allow overwrite
vfs.copy('/src', '/dest', { mode: 'replace' })
```

### Lock Inheritance (Bubble-up)

When performing destructive operations, the VFS checks locks on the target **and all its ancestors**. This is called "Inherited Protection" - a lock on a directory implicitly protects its entire subtree.

If you attempt to `rm /a/b/c`:
1. Check if `c` is locked
2. Check if `b` is locked (parent of `c`)
3. Check if `a` is locked (parent of `b`)

If any ancestor is locked with the appropriate permission, the operation fails.

```typescript
// Lock a file
vfs.lock('/project/src/main.ts', 'user1', { delete: true })

// Attempting to delete will fail - parent is also protected by ancestor locks
vfs.lock('/project/src', 'admin', { delete: true })
// Now /project/src and ALL children cannot be deleted
```

### Circular Reference Prevention

The VFS prevents creating circular directory structures (e.g., moving `/a` into `/a/b`).

```typescript
// This would create: /a/b/a (circular!)
vfs.move('/a', '/a/b/a')
// → Error: { type: 'circular_reference'; path: '/a/b/a' }
```

### Memory Management

- **Immediate cleanup**: When a file is deleted, its content is eligible for garbage collection
- **No snapshots**: The VFS does not maintain internal history (planned feature)
- **Binary content**: `Uint8Array` is preferred for large files as it's more memory-efficient than strings

---

## Lock System

Prevents modification, deletion, or renaming of files and directories.

### Types

```typescript
type LockPermissions = {
  write: boolean      // Block writeFile (default: true)
  delete: boolean     // Block rm (default: true)
  rename: boolean    // Block rename (default: true)
  lock: boolean       // Block adding new locks (default: false)
}

type Lock = {
  owner: string
  permissions: LockPermissions
  reason?: string
  createdAt: Date
}

type LockError =
  | { type: 'locked'; lock: Lock }
  | { type: 'not_owner'; lock: Lock }
  | { type: 'already_locked'; lock: Lock }
  | { type: 'force_required'; lock: Lock }
  | { type: 'not_locked'; path: string }
  | { type: 'parent_locked'; path: string; lock: Lock }
```

### API

All lock operations return `Result`:

| Method | Signature | Returns |
|--------|-----------|---------|
| `lock` | `(path: string, owner: string, permissions: LockPermissions, reason?: string) => Result<Lock, FSError \| LockError>` | The lock |
| `unlock` | `(path: string, owner?: string, force?: boolean) => Result<void, LockError>` | Success |
| `getLock` | `(path: string) => Maybe<Lock>` | The lock if exists |

### Usage Example

```typescript
// Lock a file (defaults: write=true, delete=true, rename=true, lock=false)
const lockResult = vfs.lock('/src/main.ts', 'user1', { write: true, delete: false }, 'Working on it')
if (isErr(lockResult)) {
  console.error(lockResult.error)
}

// Attempt to write (will fail)
const writeResult = vfs.writeFile('/src/main.ts', 'new content')
if (isErr(writeResult) && writeResult.error.type === 'locked') {
  console.log('File is locked by:', writeResult.error.lock.owner)
}

// Unlock (must be owner or force)
vfs.unlock('/src/main.ts', 'user1')

// Force unlock (bypass owner check)
vfs.unlock('/src/main.ts', undefined, true)
```

### Lock Features

- **Default permissions**: Write, delete, and rename are blocked by default
- **Inherited Protection**: Locking a directory implicitly protects all its children. Operations on any descendant will check ancestor locks.
- **Timeout support**: Locks can optionally expire after a duration (planned)

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
  timestamp: Date
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

### Return Value

Each command returns a structured result for programmatic use:

```typescript
type ShellResult = {
  stdout: string
  stderr: string
  exitCode: number
}

const result = shell.exec('cat /src/main.ts')
// result = { stdout: 'console.log("hello")', stderr: '', exitCode: 0 }

if (result.exitCode !== 0) {
  console.error(result.stderr)
}
```

### Usage Example

```typescript
const vfs = createFileSystem({
  root: folder({ name: '/' }),
  cwd: '/'
})
const shell = createShell({ vfs })

shell.exec('mkdir src')
shell.exec('touch src/main.ts')
shell.exec('cat src/main.ts')  // stdout: (empty file)
shell.exec('ls src')          // stdout: main.ts

// Write content using VFS directly (redirections planned)
vfs.writeFile('/src/main.ts', 'hello')
const result = shell.exec('cat src/main.ts')
// result.stdout = 'hello'
```

### Planned Shell Features

- Pipes `|`
- Redirections `>`, `>>`, `<`
- Environment variables `$VAR`
- Glob patterns `*.ts`
- Command: `grep`, `find`, `tree`
- Command history
- Tab completion

---

## Design Principles

1. **Pure TypeScript** - No external runtime dependencies
2. **No Classes** - Functions only for better composability
3. **Maybe/Result Monads** - From `@deessejs/core` for explicit error handling
4. **Path Validation** - Security against traversal attacks
5. **Cross-Platform** - Works in Node.js and browser
6. **Event-Driven** - Watch for changes
7. **Separation of Concerns** - VFS is pure, Shell interprets commands
8. **Normalized Data** - No redundant data in types (path derived from tree)
9. **Consistent Timestamps** - All dates use `Date` type
10. **Efficient Lookups** - Children stored as `Record` for O(1) access
11. **Fail by Default** - Operations fail on conflicts to prevent data loss
12. **Safety First** - Lock inheritance and circular reference prevention

---

## Planned Features

The following features are planned for future versions:

- Binary file support (`Uint8Array`, `Blob`)
- File metadata (mime type, permissions)
- File system snapshots/clones (`toJSON`, `fromJSON`)
- Search operations (`find`, `glob`, `grep`)
- Lock timeouts/expiration
- Batch operations
- Audit log
- Undo/redo
- Async variants for future provider support
- Streaming for large files
- Atomic operations / Transactions (rollback on failure)
