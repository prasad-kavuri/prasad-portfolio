export type ReviewCheckpoint<T> =
  | { status: 'pending'; pending: T; approved: null }
  | { status: 'approved'; pending: null; approved: T };

export function resolveReviewCheckpoint<T>(
  output: T,
  reviewMode: boolean
): ReviewCheckpoint<T> {
  if (reviewMode) {
    return { status: 'pending', pending: output, approved: null };
  }

  return { status: 'approved', pending: null, approved: output };
}
