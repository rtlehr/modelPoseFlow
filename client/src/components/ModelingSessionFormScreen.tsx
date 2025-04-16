import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getModelingSession, 
  createModelingSession, 
  updateModelingSession, 
  getAllHosts 
} from "../lib/modelingSessionsService";
import type { ModelingSession, Host } from "@shared/schema";
import HelpModal from "./HelpModal";
import { FiHelpCircle, FiStar, FiDollarSign } from "react-icons/fi";

interface ModelingSessionFormScreenProps {
  sessionId?: number; // If provided, we're editing an existing session
  preselectedHostId?: number; // If provided, preselect this host
  onBack: () => void;
  onSaved: (sessionId: number) => void;
}

export default function ModelingSessionFormScreen({ 
  sessionId, 
  preselectedHostId,
  onBack, 
  onSaved 
}: ModelingSessionFormScreenProps): JSX.Element {
  const queryClient = useQueryClient();
  const [showHelp, setShowHelp] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [hostId, setHostId] = useState<number | "">("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0] // Default to today in YYYY-MM-DD format
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pay, setPay] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(3); // Default to middle rating
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch all hosts for the dropdown
  const { 
    data: hosts = [],
    isLoading: isLoadingHosts
  } = useQuery({
    queryKey: ['/api/hosts'],
    queryFn: getAllHosts
  });
  
  // If sessionId is provided, fetch existing session data
  const { 
    data: existingSession, 
    isLoading: isLoadingSession 
  } = useQuery({
    queryKey: [`/api/modeling-sessions/${sessionId}`],
    queryFn: () => getModelingSession(sessionId || 0),
    enabled: !!sessionId, // Only run query if sessionId is provided
  });
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (existingSession) {
      setTitle(existingSession.title);
      setHostId(existingSession.hostId);
      // Format date as YYYY-MM-DD for input
      setSessionDate(existingSession.sessionDate.split('T')[0]);
      setStartTime(existingSession.startTime || "");
      setEndTime(existingSession.endTime || "");
      setPay(existingSession.pay ? existingSession.pay.toString() : "");
      setNotes(existingSession.notes || "");
      setRating(existingSession.rating);
    } else if (preselectedHostId) {
      // If we have a preselected host (when adding from host detail screen)
      setHostId(preselectedHostId);
    }
  }, [existingSession, preselectedHostId]);
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: createModelingSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/modeling-sessions'] });
      if (hostId) {
        queryClient.invalidateQueries({ queryKey: [`/api/hosts/${hostId}/modeling-sessions`] });
      }
      onSaved(newSession.id);
    }
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, session }: { id: number; session: Partial<ModelingSession> }) => 
      updateModelingSession(id, session),
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: [`/api/modeling-sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/modeling-sessions'] });
      if (hostId) {
        queryClient.invalidateQueries({ queryKey: [`/api/hosts/${hostId}/modeling-sessions`] });
      }
      onSaved(updatedSession.id);
    }
  });
  
  // Find the selected host object by ID
  const selectedHost = hosts.find(host => host.id === hostId);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = "Session title is required";
    }
    
    if (!hostId) {
      newErrors.hostId = "Host is required";
    }
    
    if (!sessionDate) {
      newErrors.sessionDate = "Session date is required";
    }
    
    if (pay && isNaN(Number(pay))) {
      newErrors.pay = "Pay must be a valid number";
    }
    
    setErrors(newErrors);
    
    // If no validation errors, submit the form
    if (Object.keys(newErrors).length === 0 && selectedHost) {
      const payValue = pay ? parseFloat(pay) : null;
      
      const sessionData = {
        title,
        hostId: selectedHost.id,
        hostName: selectedHost.name,
        hostContactInfo: selectedHost.contactNumber || selectedHost.email || null,
        sessionDate,
        startTime: startTime || null,
        endTime: endTime || null,
        pay: payValue,
        notes: notes || null,
        rating
      };
      
      if (sessionId) {
        // Update existing session
        updateSessionMutation.mutate({ id: sessionId, session: sessionData });
      } else {
        // Create new session
        createSessionMutation.mutate(sessionData);
      }
    }
  };
  
  // Render stars for rating selection
  const renderRatingSelector = () => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="p-1 focus:outline-none"
          >
            <FiStar 
              size={24} 
              className={
                value <= rating 
                  ? "text-yellow-500 fill-yellow-500" 
                  : "text-gray-300"
              } 
            />
          </button>
        ))}
      </div>
    );
  };

  // Help content
  const helpInstructions = (
    <div className="space-y-4">
      <p>
        Use this form to {sessionId ? "edit an existing" : "add a new"} modeling session.
      </p>
      
      <h3 className="text-lg font-medium">Form Fields:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Title</strong> - Required. A descriptive name for the session (e.g., "Three-hour Portrait Session")</li>
        <li><strong>Host</strong> - Required. The studio, organization, or individual that hosted this session</li>
        <li><strong>Date</strong> - Required. When the modeling session took place</li>
        <li><strong>Start Time</strong> - Optional. When the session began</li>
        <li><strong>End Time</strong> - Optional. When the session ended</li>
        <li><strong>Pay</strong> - Optional. The amount you were paid for this session</li>
        <li><strong>Notes</strong> - Optional. Any details about the session you want to remember</li>
        <li><strong>Rating</strong> - Your personal rating for this session (1-5 stars)</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Include details about the poses, duration, and any challenges in your notes</li>
        <li>If you don't see the host you need, go back and add them first</li>
        <li>Your rating can reflect your overall experience, not just the pay</li>
      </ul>
    </div>
  );
  
  // Show loading state if fetching existing session data
  const isLoading = (sessionId && isLoadingSession) || isLoadingHosts;
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">
            {sessionId ? "Edit Session" : "Add New Session"}
          </h1>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 text-gray-500 hover:text-primary"
          aria-label="Help"
        >
          <FiHelpCircle size={20} />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          title={`${sessionId ? "Edit" : "Add"} Modeling Session Help`}
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Session Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter session title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Host Field */}
            <div>
              <label htmlFor="hostId" className="block text-sm font-medium mb-1">
                Host <span className="text-red-500">*</span>
              </label>
              <select
                id="hostId"
                value={hostId}
                onChange={(e) => setHostId(e.target.value ? Number(e.target.value) : "")}
                className={`w-full p-2 border rounded-md ${
                  errors.hostId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a host</option>
                {hosts.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name}
                  </option>
                ))}
              </select>
              {errors.hostId && (
                <p className="mt-1 text-sm text-red-500">{errors.hostId}</p>
              )}
            </div>

            {/* Session Date Field */}
            <div>
              <label htmlFor="sessionDate" className="block text-sm font-medium mb-1">
                Session Date <span className="text-red-500">*</span>
              </label>
              <input
                id="sessionDate"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  errors.sessionDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.sessionDate && (
                <p className="mt-1 text-sm text-red-500">{errors.sessionDate}</p>
              )}
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time Field */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                  Start Time (optional)
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* End Time Field */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                  End Time (optional)
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Pay Field */}
            <div>
              <label htmlFor="pay" className="block text-sm font-medium mb-1">
                Pay (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-500" />
                </div>
                <input
                  id="pay"
                  type="text"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  className={`w-full pl-8 p-2 border rounded-md ${
                    errors.pay ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.pay && (
                <p className="mt-1 text-sm text-red-500">{errors.pay}</p>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Add any notes about this session"
                rows={4}
              />
            </div>

            {/* Rating Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Rating
              </label>
              {renderRatingSelector()}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
              >
                {createSessionMutation.isPending || updateSessionMutation.isPending
                  ? "Saving..."
                  : sessionId
                  ? "Update Session"
                  : "Add Session"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}