/**
 * Slug generation utilities for filesystem-safe folder names.
 * Slugs are immutable once created and unique within their parent scope.
 */

/**
 * Converts a name to a filesystem-safe slug.
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start/end
 * - Limits length to 50 characters
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces and common separators with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove any characters that aren't alphanumeric or hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .slice(0, 50)
    // If empty after processing, use a default
    || 'untitled';
}

/**
 * Generates a unique slug by appending a number if the base slug already exists.
 * @param baseName - The original name to slugify
 * @param existingSlugs - Array of existing slugs in the same scope
 * @returns A unique slug
 */
export function generateUniqueSlug(baseName: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(baseName);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // Find the next available number
  let counter = 1;
  let candidateSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }
  
  return candidateSlug;
}

/**
 * Builds the file storage path for a cut based on the hierarchy slugs.
 * @param projectSlug - The project's slug
 * @param vibeSlug - The vibe's slug
 * @param cutSlug - The cut's slug
 * @param fileType - Either 'audio' or 'stems'
 * @returns The relative path for file storage
 */
export function buildFilePath(
  projectSlug: string,
  vibeSlug: string,
  cutSlug: string,
  fileType: 'audio' | 'stems'
): string {
  return `uploads/${projectSlug}/${vibeSlug}/${cutSlug}/${fileType}`;
}
