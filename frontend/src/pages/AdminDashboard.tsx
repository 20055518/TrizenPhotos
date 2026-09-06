import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, authApi } from '../api/client';
import { EventItem, User } from '../types';
import { 
  Calendar, MapPin, Plus, Image as ImageIcon, CheckCircle2, 
  Copy, Check, Users, Trash2, ArrowRight, ShieldCheck 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    authApi.getTeamMembers().then(setTeamMembers).catch(console.error);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await eventsApi.create({
        name,
        date,
        location,
        description,
        assigned_team_ids: selectedTeam,
      });
      setIsModalOpen(false);
      setName('');
      setDate('');
      setLocation('');
      setDescription('');
      setSelectedTeam([]);
      await fetchEvents();
    } catch (err) {
      alert('Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the event "${name}"? All uploaded photos and gallery links will be removed.`)) {
      try {
        await eventsApi.delete(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        alert('Failed to delete event.');
      }
    }
  };

  const copyGalleryLink = (slug: string) => {
    const url = `${window.location.origin}/gallery/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="animate-gradient-text">Photography Events</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {events.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage shoots, assign photographers, curate selected photos, and publish customer galleries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-press w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950 font-bold" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6 sm:mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded-lg animate-shimmer" />
                  <div className="h-4 w-16 rounded-full animate-shimmer" />
                </div>
                <div className="h-6 w-3/4 rounded-lg animate-shimmer" />
                <div className="h-4 w-1/2 rounded-lg animate-shimmer" />
                <div className="h-4 w-full rounded-lg animate-shimmer" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="h-14 rounded-xl animate-shimmer" />
                  <div className="h-14 rounded-xl animate-shimmer" />
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex justify-between">
                <div className="h-8 w-28 rounded-lg animate-shimmer" />
                <div className="h-8 w-8 rounded-lg animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl my-6 p-6 sm:p-8 bg-slate-900/30">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-semibold text-white">No events yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Create your first event to start assigning photographers and uploading photos.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6 sm:mt-8">
          {events.map((event, idx) => {
            const isPublished = event.gallery?.is_published;
            const staggerClass = `stagger-${Math.min(idx + 1, 10)}`;
            return (
              <div
                key={event.id}
                className={`animate-fade-up ${staggerClass} bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-slate-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-300 flex flex-col justify-between shadow-lg`}
              >
                <div className="p-4 sm:p-6">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className="text-[11px] sm:text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {event.date || 'Date TBD'}
                    </span>
                    {isPublished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Live PIN
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                        Draft
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-1 mb-1">
                    {event.name}
                  </h2>

                  {event.location && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}

                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 sm:mb-4">
                      {event.description}
                    </p>
                  )}

                  {/* Photo Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 mb-3 sm:mb-4">
                    <div>
                      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Uploaded
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>{event.total_photos}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        In Gallery
                      </div>
                      <div className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>{event.selected_photos}</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-2">
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400/80" />
                      <span>Assigned Photographers</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {event.assigned_team_members && event.assigned_team_members.length > 0 ? (
                        event.assigned_team_members.map((tm) => (
                          <span
                            key={tm.id}
                            className="text-[10px] sm:text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                          >
                            {tm.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">None assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors"
                    >
                      <span>Manage & Curate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isPublished && event.gallery?.slug && (
                      <button
                        onClick={() => copyGalleryLink(event.gallery!.slug)}
                        title="Copy Public Gallery URL"
                        className="p-1.5 sm:p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                      >
                        {copiedSlug === event.gallery.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="hidden xs:inline sm:inline">
                          {copiedSlug === event.gallery.slug ? 'Copied' : 'Link'}
                        </span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(event.id, event.name)}
                    title="Delete Event"
                    className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Create New Photography Event</h2>
            <p className="text-xs text-slate-400 mb-4">
              Set up the event details and assign photographers from your team.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun & Priya Wedding"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Taj Palace, Mumbai"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief notes about ceremony or coverage requirements..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assign Photographers / Team Members
                </label>
                <div className="max-h-32 sm:max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  {teamMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2">No team members registered yet.</p>
                  ) : (
                    teamMembers.map((tm) => (
                      <label
                        key={tm.id}
                        className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeam.includes(tm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeam([...selectedTeam, tm.id]);
                            } else {
                              setSelectedTeam(selectedTeam.filter((id) => id !== tm.id));
                            }
                          }}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="font-medium text-white">{tm.name}</span>
                        <span className="text-slate-500 text-[11px] truncate">({tm.email})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-600/20 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
