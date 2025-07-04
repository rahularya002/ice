import React, { useState } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Task, SubmissionFile } from '../../types';

interface TaskSubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (description: string, files: SubmissionFile[]) => void;
}

const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({ task, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const allowedFileTypes = [
    '.doc', '.docx', '.pdf', '.txt', '.jpg', '.jpeg', '.png', '.gif', 
    '.zip', '.rar', '.xlsx', '.xls', '.ppt', '.pptx'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

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
    const selectedFiles = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 2) {
      setErrorMessage('You can only upload up to 2 files.');
      return;
    }
    if (selectedFiles.length === 0) return;
    setUploadStatus('uploading');
    setErrorMessage('');
    try {
      const newFiles: SubmissionFile[] = [];
      for (const file of selectedFiles) {
        // Validate file size
        if (file.size > maxFileSize) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }

        // Validate file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedFileTypes.includes(fileExtension)) {
          throw new Error(`File type "${fileExtension}" is not allowed.`);
        }

        const result = await uploadFileToCloudinary(file);
        newFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: result.original_filename,
          size: result.bytes,
          type: result.format,
          url: result.secure_url,
          uploadedAt: new Date(),
        });
      }
      setFiles(prev => [...prev, ...newFiles]);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (error) {
      setErrorMessage('Upload failed');
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setErrorMessage('Please upload at least one file');
      return;
    }

    onSubmit(description, files);
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Submit Work</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files <span className="text-red-500">*</span>
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept={allowedFileTypes.join(',')}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploadStatus === 'uploading'}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {getUploadStatusIcon()}
                  <span className="text-sm text-gray-600">
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Click to upload files or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Supported: {allowedFileTypes.join(', ')} (Max 10MB each)
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mt-2 flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Files uploaded successfully!</span>
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Files ({files.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <File className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Description (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work you've completed, any challenges faced, or additional notes..."
              />
            </div>

            {/* Submission Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Submission Guidelines:</h5>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Upload all relevant files for your completed work</li>
                <li>• Include documentation, code, designs, or any deliverables</li>
                <li>• Add a description to help reviewers understand your work</li>
                <li>• Ensure all files are properly named and organized</li>
                <li>• Your submission will be reviewed by the task assignee</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={files.length === 0 || uploadStatus === 'uploading'}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              >
                Submit Work
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskSubmissionModal;