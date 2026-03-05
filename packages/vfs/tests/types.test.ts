import { describe, it, expect } from "vitest";
import { isFile, isDirectory, File, Directory } from "../src/types";

describe("types", () => {
  describe("isFile", () => {
    it("returns true for File", () => {
      const file: File = {
        name: "test.txt",
        path: "/test.txt",
        isDirectory: false,
        content: "hello",
        size: 5,
        createdAt: "2024-01-01T00:00:00.000Z",
        modifiedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(isFile(file)).toBe(true);
    });

    it("returns false for Directory", () => {
      const dir: Directory = {
        name: "test",
        path: "/test",
        isDirectory: true,
        children: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        modifiedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(isFile(dir)).toBe(false);
    });
  });

  describe("isDirectory", () => {
    it("returns true for Directory", () => {
      const dir: Directory = {
        name: "test",
        path: "/test",
        isDirectory: true,
        children: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        modifiedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(isDirectory(dir)).toBe(true);
    });

    it("returns false for File", () => {
      const file: File = {
        name: "test.txt",
        path: "/test.txt",
        isDirectory: false,
        content: "hello",
        size: 5,
        createdAt: "2024-01-01T00:00:00.000Z",
        modifiedAt: "2024-01-01T00:00:00.000Z",
      };
      expect(isDirectory(file)).toBe(false);
    });
  });
});
