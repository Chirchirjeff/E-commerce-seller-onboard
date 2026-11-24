/** Public profile fields the backend exposes for buyers and reviewers. */
export interface PublicUserProfile {
  id?: string
  name?: string | null
  /** Lowercase public handle without the leading "@", e.g. "jane.doe". */
  username?: string | null
  /** Square Cloudinary image (res.cloudinary.com), or null when unset. */
  avatarUrl?: string | null
}
