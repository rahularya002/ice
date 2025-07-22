import React, { useState, useEffect } from 'react';
import { User, Meeting, SubmissionFile } from '../../types';
import { meetingService } from '../../services/meetingService';
import { userService } from '../../services/userService';

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onMeetingUpdated: (meeting: Meeting) => void;
  currentUserId: string;
}

const EditMeetingModal: React.FC<EditMeetingModalProps> = ({ isOpen, onClose, meeting, onMeetingUpdated, currentUserId }) => {
  const [title, setTitle] = useState(meeting.title || '');
  const [description, setDescription] = useState(meeting.description || '');
  const [date, setDate] = useState(meeting.date || '');
  const [time, setTime] = useState(meeting.time || '');
  const [participants, setParticipants] = useState<string[]>(meeting.participants || []);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizerId, setOrganizerId] = useState<string>(meeting.createdBy || currentUserId);
  const [agendaFile, setAgendaFile] = useState<SubmissionFile | null>(meeting.agendaFile || null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(meeting.title || '');
      setDescription(meeting.description || '');
      setDate(meeting.date || '');
      setTime(meeting.time || '');
      setParticipants(meeting.participants || []);
      setOrganizerId(meeting.createdBy || currentUserId);
      setAgendaFile(meeting.agendaFile || null);
      userService.getUsers().then(res => {
        if (res.success && 'data' in res) setUsers(res.data);
      });
    }
  }, [isOpen, meeting, currentUserId]);

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

  const handleAgendaFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > maxFileSize) {
      setUploadError('File is too large. Max 10MB.');
      return;
    }
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedFileTypes.includes(fileExtension)) {
      setUploadError(`File type "${fileExtension}" is not allowed.`);
      return;
    }
    setUploadStatus('uploading');
    setUploadError(null);
    try {
      const result = await uploadFileToCloudinary(file);
      setAgendaFile({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: result.original_filename,
        size: result.bytes,
        type: file.type && file.type.trim() !== '' ? file.type : (result.format && result.format.trim() !== '' ? result.format : 'application/octet-stream'),
        url: result.secure_url,
        uploadedAt: new Date(),
      });
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (e) {
      setUploadError('Upload failed');
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
    event.target.value = '';
  };

  const removeAgendaFile = () => setAgendaFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!title || !date || !time || participants.length === 0) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    if (uploadStatus === 'uploading') {
      setError('Please wait for agenda file upload to complete.');
      setLoading(false);
      return;
    }
    const updates = {
      title,
      description,
      date,
      time,
      participants,
      createdBy: organizerId,
      agendaFile: agendaFile || undefined,
    };
    const result = await meetingService.updateMeeting(meeting.id, updates);
    if (result.success && result.data) {
      onMeetingUpdated(result.data);
      onClose();
    } else {
      setError('Failed to update meeting.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-amber-700 flex items-center">
          <span className="mr-2">Edit Meeting</span>
        </h2>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={date} onChange={e => setDate(e.target.value)} required min={today} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Time <span className="text-red-500">*</span></label>
              <input type="time" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organizer <span className="text-red-500">*</span></label>
            <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={organizerId} onChange={e => setOrganizerId(e.target.value)} required>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Participants <span className="text-red-500">*</span></label>
            <select multiple className="w-full border rounded-lg px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={participants} onChange={e => setParticipants(Array.from(e.target.selectedOptions, option => option.value))} required>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agenda File (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept={allowedFileTypes.join(',')}
                onChange={handleAgendaFileUpload}
                className="hidden"
                id="agenda-file-upload-edit"
                disabled={uploadStatus === 'uploading'}
              />
              <label htmlFor="agenda-file-upload-edit" className="cursor-pointer flex flex-col items-center space-y-2">
                {uploadStatus === 'uploading' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <span className="text-sm text-gray-600">
                    {agendaFile ? 'Agenda file uploaded' : 'Click to upload agenda file'}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Supported: {allowedFileTypes.join(', ')} (Max 10MB)
                </span>
              </label>
            </div>
            {uploadError && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <span className="text-sm">{uploadError}</span>
              </div>
            )}
            {agendaFile && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 rounded p-2">
                <span className="text-sm text-gray-800">{agendaFile.name}</span>
                <button type="button" onClick={removeAgendaFile} className="text-red-600 hover:text-red-900 p-1" title="Remove file">Remove</button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow" disabled={loading}>{loading ? 'Updating...' : 'Update Meeting'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMeetingModal; 