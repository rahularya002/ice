import React from 'react';
import { Meeting, User } from '../../types';

interface MeetingListProps {
  meetings: Meeting[];
  users: User[];
  currentUser?: User;
  onEditMeeting?: (meeting: Meeting) => void;
  onDeleteMeeting?: (meeting: Meeting) => void;
}

const MeetingList: React.FC<MeetingListProps> = ({ meetings, users, currentUser, onEditMeeting, onDeleteMeeting }) => {
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="h-12 w-12 text-amber-200 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <p className="text-amber-600 font-medium">No meetings scheduled</p>
        <p className="text-sm text-amber-400 mt-1">Meetings you create or are invited to will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map(meeting => {
        const organizerId = (meeting as any).created_by || (meeting as any).createdBy;
        const isAdmin = currentUser?.role === 'admin';
        return (
          <div key={meeting.id} className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-amber-900 text-lg truncate">{meeting.title}</h4>
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gradient-to-r from-amber-200 to-orange-100 text-amber-700 font-medium border border-amber-200">{meeting.date} at {meeting.time}</span>
              </div>
              {meeting.description && <p className="text-sm text-amber-800 mb-2 truncate">{meeting.description}</p>}
              {meeting.agendaFile && (
                <div className="mb-2">
                  <a
                    href={meeting.agendaFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-700 underline hover:text-blue-900"
                  >
                    Download Agenda: {meeting.agendaFile.name}
                  </a>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
                <span className="font-medium">Organizer:</span>
                <span className="bg-amber-100 rounded px-2 py-1 border border-amber-200">
                  {getUserName(organizerId)}
                </span>
                <span className="font-medium ml-2">Participants:</span>
                <span className="truncate">
                  {meeting.participants.map(pid => getUserName(pid)).join(', ')}
                </span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2 mt-4 md:mt-0 md:ml-4">
                <button
                  className="px-3 py-1 rounded bg-amber-200 text-amber-900 hover:bg-amber-300 text-xs font-semibold border border-amber-300"
                  onClick={() => onEditMeeting && onEditMeeting(meeting)}
                  title="Edit Meeting"
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold border border-red-200"
                  onClick={() => onDeleteMeeting && onDeleteMeeting(meeting)}
                  title="Delete Meeting"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MeetingList; 