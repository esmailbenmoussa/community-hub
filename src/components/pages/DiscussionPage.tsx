/**
 * DiscussionPage
 * Page for viewing a single discussion with comments
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useDiscussion } from '@/hooks/useDiscussion';
import { useComments } from '@/hooks/useComments';
import { useAzureDevOps } from '@/hooks/useAzureDevOps';
import { DiscussionDetail } from '@/components/organisms/DiscussionDetail';
import { CommentReactionType } from '@/types';

export function DiscussionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAzureDevOps();

  const discussionId = id ? parseInt(id, 10) : 0;

  const {
    discussion,
    hasVoted,
    isLoading: discussionLoading,
    error: discussionError,
    toggleVote,
  } = useDiscussion({
    discussionId,
    autoFetch: discussionId > 0,
  });

  const {
    comments,
    isLoading: commentsLoading,
    isSubmitting: commentSubmitting,
    error: commentsError,
    addComment,
    updateComment,
    deleteComment,
    toggleReaction,
  } = useComments({
    discussionId,
    autoFetch: discussionId > 0,
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleAddComment = async (text: string) => {
    await addComment(text);
  };

  const handleEditComment = async (commentId: number, text: string) => {
    await updateComment(commentId, text);
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteComment(commentId);
  };

  const handleToggleReaction = (
    commentId: number,
    type: CommentReactionType
  ) => {
    if (user) {
      toggleReaction(commentId, type, user.id);
    }
  };

  // Error state
  if (discussionError || commentsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-16 w-16 text-state-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-content">
            Error loading discussion
          </h2>
          <p className="mb-4 text-content-secondary">
            {discussionError || commentsError}
          </p>
          <button
            onClick={handleBack}
            className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Back to discussions
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!discussionLoading && !discussion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-16 w-16 text-content-disabled"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-content">
            Discussion not found
          </h2>
          <p className="mb-4 text-content-secondary">
            The discussion you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <button
            onClick={handleBack}
            className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Back to discussions
          </button>
        </div>
      </div>
    );
  }

  // Loading state (handled by DiscussionDetail skeleton)
  // Main content
  return (
    <div className="min-h-screen bg-surface">
      {discussion && (
        <DiscussionDetail
          discussion={discussion}
          hasVoted={hasVoted}
          comments={comments}
          currentUser={user || undefined}
          onVote={toggleVote}
          onBack={handleBack}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onToggleReaction={handleToggleReaction}
          isLoading={discussionLoading}
          commentsLoading={commentsLoading}
          commentActionPending={commentSubmitting}
        />
      )}

      {/* Show skeleton when loading without discussion */}
      {discussionLoading && !discussion && (
        <DiscussionDetail
          discussion={{
            id: 0,
            title: '',
            body: '',
            category: 'Announcements' as never,
            visibility: 'Project' as never,
            targetProjects: [],
            voteCount: 0,
            commentCount: 0,
            isPinned: false,
            labels: [],
            author: { id: '', displayName: '' },
            createdDate: new Date(),
            changedDate: new Date(),
            projectId: '',
            projectName: '',
            state: '',
          }}
          hasVoted={false}
          comments={[]}
          onVote={() => {}}
          onBack={handleBack}
          onAddComment={async () => {}}
          isLoading={true}
        />
      )}
    </div>
  );
}

export default DiscussionPage;
