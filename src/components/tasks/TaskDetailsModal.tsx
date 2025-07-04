import React, { useState, useEffect } from 'react';
import { X, File, Download, MessageSquare, Clock, User, Calendar } from 'lucide-react';
import { Task, User as UserType } from '../../types';
import { userService } from '../../services/userService';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  currentUser: UserType | null;
  onCommentAdd: (comment: string) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ 
  task, 
  onClose, 
  currentUser, 
  onCommentAdd 
}) => {
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'comments'>('details');
  const [users, setUsers] = useState<UserType[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  useEffect(() => {
    async function fetchUsers() {
      const result = await userService.getUsers();
      if (result.success && 'data' in result && result.data) setUsers(result.data);
    }
    fetchUsers();
  }, []);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) return user.name;
    // Try to show the userId as fallback
    return userId ? `User: ${userId}` : 'Unknown User';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onCommentAdd(newComment.trim());
    setNewComment('');
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Debug: log attachments when modal renders
  useEffect(() => {
    if ((currentUser?.id === task.assignedTo || currentUser?.id === task.assignedBy || currentUser?.role === 'admin' || currentUser?.role === 'manager')) {
      console.log('Task Attachments:', task.attachments);
    }
  }, [task.attachments, currentUser, task.assignedTo, task.assignedBy]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Submissions ({task.submissions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Comments ({task.comments?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Task Header */}
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h4>
                <p className="text-gray-600">
                  {showFullDescription || task.description.length <= 200
                    ? task.description
                    : `${task.description.slice(0, 200)}...`}
                  {task.description.length > 200 && (
                    <button
                      className="ml-2 text-blue-600 underline text-xs"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>
              </div>

              {/* Attachments Section (Admin/Manager uploads) */}
              {((currentUser?.id === task.assignedTo || currentUser?.id === task.assignedBy || currentUser?.role === 'admin' || currentUser?.role === 'manager')) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Task Attachments</p>
                  {task.attachments && task.attachments.length > 0 ? (
                    <ul className="space-y-2">
                      {task.attachments.map((file) => (
                        <li key={file.id} className="flex items-center space-x-2 bg-gray-50 rounded px-2 py-1">
                          <File className="h-4 w-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center">
                            <Download className="h-4 w-4 ml-1" /> Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-xs italic">No files attached</div>
                  )}
                </div>
              )}

              {/* Task Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium text-gray-900">{getUserName(task.assignedTo)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Assigned By</p>
                      <p className="font-medium text-gray-900">{getUserName(task.assignedBy)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              {(task.estimatedHours || task.actualHours) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Time Tracking
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Estimated Hours</p>
                      <p className="text-lg font-semibold text-gray-900">{task.estimatedHours || 0}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Actual Hours</p>
                      <p className="text-lg font-semibold text-gray-900">{task.actualHours || 0}h</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {task.submissions && task.submissions.length > 0 ? (
                task.submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          Submitted by {getUserName(submission.submittedBy)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.submittedAt ? submission.submittedAt.toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>

                    {submission.description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">{submission.description}</p>
                      </div>
                    )}

                    {submission.files.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Files:</p>
                        <div className="space-y-2">
                          {submission.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-900">{file.name}</span>
                                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                              </div>
                              {file.url ? (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 p-1">
                                  <Download className="h-4 w-4" />
                                </a>
                              ) : (
                                <span className="text-xs text-red-500">No download URL: {file.url || 'N/A'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-900">Feedback:</p>
                        <p className="text-sm text-blue-800">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {currentUser?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                      >
                        Add Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getUserName(comment.userId).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">{getUserName(comment.userId)}</p>
                            <p className="text-xs text-gray-500">{comment.createdAt.toLocaleString()}</p>
                          </div>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No comments yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;