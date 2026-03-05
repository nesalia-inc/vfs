import { describe, it, expect } from "vitest";
import { isFile, isDirectory, File, Directory } from "./types";

describe("types", () => {
  describe("isFile", () => {
    it("returns true for File", () => {
      const file: File = {
        name: "test.txt",
        path: "/test.txt",
        isDirectory: false,
        content: "hello",
        size: 5,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      expect(isFile(file)).toBe(true);
    });

    it("returns false for Directory", () => {
      const dir: Directory = {
        name: "test",
        path: "/test",
        isDirectory: true,
        children: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
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
        createdAt: new Date(),
        modifiedAt: new Date(),
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
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      expect(isDirectory(file)).toBe(false);
    });
  });
});
