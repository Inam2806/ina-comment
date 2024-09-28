import React, { useState, useEffect } from 'react';
import './style/style.scss';
import 'font-awesome/css/font-awesome.min.css';

const CommentSection = () => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [starredComments, setStarredComments] = useState(new Set());
  const [showTimestamp, setShowTimestamp] = useState(false);

  useEffect(() => {
    const storedComments = JSON.parse(localStorage.getItem('comments')) || [];
    const storedStarredComments = JSON.parse(localStorage.getItem('starredComments')) || {};
    setComments(storedComments);
    setStarredComments(storedStarredComments);
  }, []);

  useEffect(() => {
    localStorage.setItem('comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('starredComments', JSON.stringify(starredComments));
  }, [starredComments]);
  const generateCommentId = () => {
    if (!replyingTo) {
      // If not replying to any comment, generate a regular comment ID
      return comments.length + 1;
    } else {
      // If replying, generate a reply ID based on the hierarchy
      const parentComment = comments.find(comment => comment.id === replyingTo.id);
      if (parentComment) {
        const replyIndex = parentComment.replies.length + 1;
        const parentLevel = parentComment.id.toString().split('.').length;

        return `${parentComment.id}.${replyIndex}`.padEnd(parentLevel + 2, '.1');
      }
    }
    return null; // Handle the case where replyingTo is not found
  };


  const handlePostComment = () => {
    if (!newCommentText) {
      return;
    }

    const newComment = {
      id: generateCommentId(),
      text: newCommentText,
      timestamp: Date.now(),
      replies: [],
      isStarred: false,
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
    setReplyingTo(null);
  };
  const handleDeleteComment = (commentId) => {
    const updatedComments = deleteComment(comments, commentId);
    setComments(updatedComments);
  };
  
  const deleteComment = (commentList, commentId) => {
    return commentList.filter((comment) => {
      if (comment.id === commentId) {
        return false; // Exclude the comment to be deleted
      } else if (comment.replies && comment.replies.length > 0) {
        // Recursively update replies
        comment.replies = deleteComment(comment.replies, commentId);
        return true;
      }
      return true;
    });
  };

  const handleReplyToComment = (parentCommentId) => {
    setReplyingTo({ id: parentCommentId });
  };

  const handlePostReply = (parentCommentId) => {
    if (!replyText[parentCommentId]) {
      return;
    }

    const updatedComments = comments.map((comment) => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [
            ...comment.replies,
            {
              id: generateCommentId(),
              text: replyText[parentCommentId],
              timestamp: Date.now(),
              isStarred: false,
              replies: [],
            },
          ],
        };
      } else if (comment.replies) {
        return {
          ...comment,
          replies: updateReplies(comment.replies, parentCommentId),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    setReplyText((prevReplyText) => ({ ...prevReplyText, [parentCommentId]: '' }));
    setReplyingTo(null);
  };
  const toggleTimestampVisibility = () => {
    setShowTimestamp((prevShowTimestamp) => !prevShowTimestamp);
  };
  
  const updateReplies = (replies, parentCommentId) => {
    return replies.map((reply) => {
      if (reply.id === parentCommentId) {
        return {
          ...reply,
          replies: [
            ...reply.replies,
            {
              id: generateCommentId(),
              text: replyText[parentCommentId],
              timestamp: Date.now(),
              isStarred: false,
              replies: [],
            },
          ],
        };
      } else if (reply.replies) {
        return {
          ...reply,
          replies: updateReplies(reply.replies, parentCommentId),
        };
      }
      return reply;
    });
  };

  const handleToggleStar = (commentId) => {
    setStarredComments((prevStarredComments) => {
      const updatedStarredComments = { ...prevStarredComments };
      if (updatedStarredComments[commentId]) {
        delete updatedStarredComments[commentId];
      } else {
        updatedStarredComments[commentId] = true;
      }
      return updatedStarredComments;
    });
  };

  const isCommentStarred = (commentId) => {
    return starredComments[commentId];
  };

  
  const renderComments = (commentList, level = 1) => (
    <ul>
      {commentList.map((comment) => (
        <li key={comment.id}>
          <div className="comment-content">
            <div className="comment-text">
              {comment.text}
              {showTimestamp && <span className="timestamp">{new Date(comment.timestamp).toLocaleString()}</span>}
            </div>
            <div className="comment-buttons">
              <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
  
              {level < 3 && (
                <>
                  <button onClick={() => handleReplyToComment(comment.id)}>Reply</button>
                  <button onClick={() => handleToggleStar(comment.id)}>
                    {isCommentStarred(comment.id) ? (
                      <i className="fa-solid fa-star"></i>
                    ) : (
                      <i className="fa-regular fa-star"></i>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          {replyingTo && replyingTo.id === comment.id && (
            <div>
              <textarea
                placeholder={`Reply to: ${comment.text}`}
                value={replyText[comment.id] || ''}
                onChange={(e) =>
                  setReplyText((prevReplyText) => ({
                    ...prevReplyText,
                    [comment.id]: e.target.value,
                  }))
                }
              ></textarea>
              <button onClick={() => handlePostReply(comment.id)}>Post Reply</button>
            </div>
          )}
          {level < 3 && comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="comment-section">
      <h2>Comments</h2>
      <button className='timestampButton' onClick={toggleTimestampVisibility}>
        {showTimestamp ? (
          <>
            Hide Timestamp <i className="fa fa-eye-slash"></i>
          </>
        ) : (
          <>
            Show Timestamp <i className="fa fa-eye"></i>
          </>
        )}
      </button>
      {renderComments(comments)}
      <textarea
        placeholder="Type your comment"
        value={newCommentText}
        onChange={(e) => setNewCommentText(e.target.value)}
      ></textarea>
      <button onClick={handlePostComment}>Post Comment</button>
    </div>
  );
};

export default CommentSection;