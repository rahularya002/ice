import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Upload, CheckCircle, AlertCircle, File as FileIcon } from 'lucide-react';
import { User } from '../../types';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../contexts/AuthContext';

interface DailyEntry {
  id: string;
  userId: string;
  date: string;
  text: string;
  file?: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
}

interface ProjectDetailsModalProps {
  project: any;
  users: User[];
  onClose: () => void;
  refreshProjects: () => Promise<void>;
  currentUserId: string;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, users, onClose, refreshProjects, currentUserId }) => {
  const [entryText, setEntryText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; url: string; size: number; type: string } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const isMember = project.memberIds?.includes(currentUserId);
  const isManager = currentUserId === project.manager_id;
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryError, setEntryError] = useState<string | null>(null);
  const { user } = useAuth();
  const [status, setStatus] = useState(project.status || 'unconfirmed');
  const [statusLoading, setStatusLoading] = useState(false);
  const canEditStatus = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager');
  const canDeleteProject = user && user.role === 'admin';

  // Fetch entries on open
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setEntryError(null);
      try {
        const result = await projectService.getProjectEntries(project.id);
        if (result.success && 'data' in result && result.data) {
          setEntries(result.data);
        } else if ('error' in result && result.error) {
          setEntryError(result.error.message || 'Failed to load entries');
        }
      } catch (err: any) {
        setEntryError('Failed to load entries');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [project.id]);

  // Cloudinary config
  const CLOUDINARY_UPLOAD_PRESET = 'task-files';
  const CLOUDINARY_CLOUD_NAME = 'dom7v8fgf';

  async function uploadFileToCloudinary(file: File) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Cloudinary upload failed');
    return await response.json();
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setUploadStatus('uploading');
    setErrorMessage('');
    try {
      const result = await uploadFileToCloudinary(selectedFile);
      setFileInfo({
        name: result.original_filename,
        url: result.secure_url,
        size: result.bytes,
        type: selectedFile.type || result.format || 'application/octet-stream',
      });
      setFile(selectedFile);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (error) {
      setErrorMessage('Upload failed');
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
    event.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    setFileInfo(null);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadStatus === 'uploading') {
      setErrorMessage('Please wait for file upload to complete before submitting.');
      return;
    }
    if (!entryText.trim()) {
      setErrorMessage('Description is required');
      return;
    }
    setErrorMessage('');
    try {
      const result = await projectService.addProjectEntry({
        projectId: project.id,
        userId: currentUserId,
        date: new Date().toISOString().slice(0, 10),
        text: entryText.trim(),
        file: fileInfo || undefined,
      });
      if (result.success) {
        // Refresh entries
        const entriesResult = await projectService.getProjectEntries(project.id);
        if (entriesResult.success && 'data' in entriesResult && entriesResult.data) {
          setEntries(entriesResult.data);
        }
        setEntryText('');
        setFile(null);
        setFileInfo(null);
        if (refreshProjects) await refreshProjects();
      } else if ('error' in result && result.error) {
        setErrorMessage(result.error.message || 'Failed to add entry');
      }
    } catch (err: any) {
      setErrorMessage('Failed to add entry');
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusLoading(true);
    try {
      const result = await projectService.updateProjectStatus(project.id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        if (refreshProjects) await refreshProjects();
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    const result = await projectService.deleteProject(project.id);
    if (result.success) {
      if (refreshProjects) await refreshProjects();
      onClose();
    } else if ('error' in result && result.error) {
      alert(result.error.message || 'Failed to delete project');
    }
  };

  const manager = users.find(u => u.id === project.manager_id);
  const members = users.filter(u => project.memberIds?.includes(u.id));

  const getUploadStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
          <div className="flex items-center gap-2">
            {canDeleteProject && (
              <button
                onClick={handleDeleteProject}
                className="text-red-500 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-1 text-xs font-semibold transition-colors"
                title="Delete Project"
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h4>
            <p className="text-gray-600 mb-2">{project.description}</p>
            <div className="flex flex-wrap gap-4 text-sm mb-2">
              <span><b>Manager:</b> {manager?.name || 'Unknown'}</span>
              <span><b>Start:</b> {project.start_date || '-'}</span>
              <span><b>End:</b> {project.end_date || '-'}</span>
              <span>
                <b>Status:</b>{' '}
                {canEditStatus ? (
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    disabled={statusLoading}
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
                  >
                    <option value="unconfirmed">Unconfirmed</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                ) : (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                )}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-medium text-gray-700">Members:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {members.length === 0 ? (
                  <span className="text-gray-400">No members assigned</span>
                ) : (
                  members.map(m => (
                    <span key={m.id} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      {m.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h5 className="font-semibold text-gray-900 mb-2">Daily Entries / Follow-ups</h5>
            {loading ? (
              <div className="text-gray-400 text-sm mb-2">Loading entries...</div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry: any) => {
                  const user = users.find(u => u.id === entry.user_id);
                  return (
                    <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-amber-800 text-sm">{user?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : entry.date}
                        </span>
                      </div>
                      <div className="text-gray-800 text-sm mb-1">{entry.text}</div>
                      {entry.file_url && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-blue-700">
                          <FileIcon className="h-4 w-4" />
                          <a href={entry.file_url} target="_blank" rel="noopener noreferrer" className="underline">
                            {entry.file_name}
                          </a>
                          <span className="text-gray-400">{entry.file_size ? `(${(entry.file_size / 1024).toFixed(1)} KB)` : ''}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {entryError && (
              <div className="flex items-center space-x-2 text-red-600 text-xs mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{entryError}</span>
              </div>
            )}
            {(isMember || isManager) && (
              <form onSubmit={handleAddEntry} className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Add your daily update..."
                    value={entryText}
                    onChange={e => setEntryText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors duration-200"
                    disabled={!entryText.trim() || uploadStatus === 'uploading' || (!!file && uploadStatus !== 'success')}
                  >
                    Add
                  </button>
                </div>
                {/* File Upload Section */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.xlsx,.xls,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="followup-file-upload"
                    disabled={uploadStatus === 'uploading'}
                  />
                  <label htmlFor="followup-file-upload" className="cursor-pointer flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                    {getUploadStatusIcon()}
                    <span>{fileInfo ? fileInfo.name : 'Attach file (optional)'}</span>
                  </label>
                  {fileInfo && (
                    <button type="button" onClick={removeFile} className="text-red-600 hover:text-red-900 text-xs ml-2">Remove</button>
                  )}
                </div>
                {errorMessage && (
                  <div className="flex items-center space-x-2 text-red-600 text-xs mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal; 