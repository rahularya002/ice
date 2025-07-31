import { supabase } from '../lib/supabase';
import { Meeting } from '../types';

export const meetingService = {
  async getMeetings() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) return { success: false, error };
    return { success: true, data };
  },

  async addMeeting(meeting: Omit<Meeting, 'id' | 'createdAt'>) {
    // Map camelCase to snake_case for DB
    const dbMeeting = {
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      participants: meeting.participants,
      created_by: meeting.createdBy, // snake_case
      created_at: new Date(),        // snake_case
      agenda_file: meeting.agendaFile || null, // new field for agenda file
    };
    const { data, error } = await supabase
      .from('meetings')
      .insert([dbMeeting])
      .select();
    if (error) return { success: false, error };
    return { success: true, data: data?.[0] };
  },

  async deleteMeeting(id: string) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    return { error };
  },
}; 