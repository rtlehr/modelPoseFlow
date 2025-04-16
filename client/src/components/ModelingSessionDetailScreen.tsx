import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getModelingSession, deleteModelingSession } from "../lib/modelingSessionsService";
import type { ModelingSession } from "@shared/schema";
import HelpModal from "./HelpModal";
import { format } from "date-fns";
import { 
  FiEdit, FiTrash2, FiInfo, FiStar, FiDollarSign, 
  FiUser, FiPhone, FiMail, FiCalendar, FiHelpCircle,
  FiClock 
} from "react-icons/fi";

interface ModelingSessionDetailScreenProps {
  sessionId: number;
  onBack: () => void;
  onEdit: (sessionId: number) => void;
  onSelectHost: (hostId: number) => void;
  onDeleted: () => void;
}

export default function ModelingSessionDetailScreen({ 
  sessionId, 
  onBack, 
  onEdit, 
  onSelectHost,
  onDeleted
}: ModelingSessionDetailScreenProps): JSX.Element {
  const [showHelp, setShowHelp] = useState(false);
  const queryClient = useQueryClient();

  // Fetch session details
  const { 
    data: session, 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: [`/api/modeling-sessions/${sessionId}`], 
    queryFn: () => getModelingSession(sessionId),
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteModelingSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modeling-sessions'] });
      if (session?.hostId) {
        queryClient.invalidateQueries({ queryKey: [`/api/hosts/${session.hostId}/modeling-sessions`] });
      }
      onDeleted();
    }
  });

  const handleDeleteSession = () => {
    if (window.confirm("Are you sure you want to delete this modeling session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  // Render stars for rating
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FiStar 
          key={i} 
          className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} 
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Help content
  const helpInstructions = (
    <div className="space-y-4">
      <p>
        This screen shows you detailed information about a specific modeling session.
      </p>
      
      <h3 className="text-lg font-medium">Features:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>View all details about this modeling session</li>
        <li>Edit the session information if needed</li>
        <li>Delete the session if it's no longer relevant</li>
        <li>Access the host information directly from this screen</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Use detailed notes to remember important aspects of the session</li>
        <li>Your ratings help you evaluate which hosts provide the best experiences</li>
        <li>Track payment information to maintain accurate financial records</li>
      </ul>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading session details...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <div className="text-red-500 text-5xl mb-4">
          <FiInfo />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Session</h2>
        <p className="text-gray-500 mb-6">
          There was a problem loading the session details. Please try again.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Format the session date for display
  const formattedDate = format(new Date(session.sessionDate), 'MMMM d, yyyy');

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
          <h1 className="text-2xl font-bold">{session.title}</h1>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-500 hover:text-primary"
            aria-label="Help"
          >
            <FiHelpCircle size={20} />
          </button>
          <button
            onClick={() => onEdit(session.id)}
            className="ml-2 flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            <FiEdit className="mr-1" /> Edit
          </button>
          <button
            onClick={handleDeleteSession}
            className="ml-2 flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            <FiTrash2 className="mr-1" /> Delete
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          title="Session Details Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Session Details */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Session Header */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">{session.title}</h2>
                <button
                  onClick={() => onSelectHost(session.hostId)}
                  className="text-primary hover:underline flex items-center"
                >
                  <FiUser className="mr-1" /> {session.hostName}
                </button>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-gray-500 flex items-center mb-2">
                  <FiCalendar className="mr-1" /> {formattedDate}
                </div>
                <div>{renderRating(session.rating)}</div>
              </div>
            </div>
            
            {session.pay && (
              <div className="mt-4 bg-white p-3 rounded-md inline-block">
                <span className="text-green-600 font-semibold flex items-center text-lg">
                  <FiDollarSign className="mr-1" /> {session.pay.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          
          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Host Contact Info */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiUser className="mr-2" /> Host Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Name:</span>
                  <button
                    onClick={() => onSelectHost(session.hostId)}
                    className="text-primary hover:underline"
                  >
                    {session.hostName}
                  </button>
                </div>
                
                {session.hostContactInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <div>
                      {session.hostContactInfo.includes('@') ? (
                        <a 
                          href={`mailto:${session.hostContactInfo}`}
                          className="text-primary hover:underline flex items-center"
                        >
                          <FiMail className="mr-1" /> {session.hostContactInfo}
                        </a>
                      ) : (
                        <a 
                          href={`tel:${session.hostContactInfo}`}
                          className="text-primary hover:underline flex items-center"
                        >
                          <FiPhone className="mr-1" /> {session.hostContactInfo}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Session Time (this would require adding a time field to the model) */}
                {/*
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time:</span>
                  <div className="flex items-center">
                    <FiClock className="mr-1 text-gray-500" /> 
                    {session.startTime} - {session.endTime}
                  </div>
                </div>
                */}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Your Rating:</span>
                  <div>
                    {renderRating(session.rating)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onSelectHost(session.hostId)}
                className="mt-4 w-full px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center justify-center"
              >
                <FiUser className="mr-1" /> View Host Details
              </button>
            </div>
            
            {/* Session Notes */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
              
              {session.notes ? (
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line text-gray-700">
                  {session.notes}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-gray-500 italic">
                  No notes recorded for this session.
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end mt-8 space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to List
            </button>
            <button
              onClick={() => onEdit(session.id)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
            >
              <FiEdit className="mr-1" /> Edit Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}