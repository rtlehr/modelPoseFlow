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
      {/* Header - Responsive Design */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b space-y-3 sm:space-y-0">
        <div className="flex items-center w-full sm:w-auto">
          <button
            onClick={onBack}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">{session.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-gray-500 hover:text-primary"
            aria-label="Help"
          >
            <FiHelpCircle size={20} />
          </button>
          <button
            onClick={() => onEdit(session.id)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            <FiEdit className="mr-1" /> Edit
          </button>
          <button
            onClick={handleDeleteSession}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Session Header - Responsive */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{session.title}</h2>
                <button
                  onClick={() => onSelectHost(session.hostId)}
                  className="text-primary hover:underline flex items-center"
                >
                  <FiUser className="mr-1" /> {session.hostName}
                </button>
              </div>
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                <div className="text-gray-500 flex items-center mb-1 text-sm">
                  <FiCalendar className="mr-1" /> {formattedDate}
                </div>
                {(session.startTime || session.endTime) && (
                  <div className="text-gray-500 flex items-center mb-2 text-xs sm:text-sm">
                    <FiClock className="mr-1" /> 
                    {session.startTime && session.endTime 
                      ? `${session.startTime} - ${session.endTime}`
                      : session.startTime 
                        ? `Starting at ${session.startTime}` 
                        : `Ending at ${session.endTime}`
                    }
                  </div>
                )}
                <div>{renderRating(session.rating)}</div>
              </div>
            </div>
            
            {session.pay && (
              <div className="mt-4 bg-white p-3 rounded-md inline-block">
                <span className="text-green-600 font-semibold flex items-center text-base sm:text-lg">
                  <FiDollarSign className="mr-1" /> {session.pay.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          
          {/* Session Details - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* Host Contact Info */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                <FiUser className="mr-2" /> Host Information
              </h3>
              
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-gray-600 text-sm">Name:</span>
                  <button
                    onClick={() => onSelectHost(session.hostId)}
                    className="text-primary hover:underline text-sm"
                  >
                    {session.hostName}
                  </button>
                </div>
                
                {session.hostContactInfo && (
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-600 text-sm">Contact:</span>
                    <div>
                      {session.hostContactInfo.includes('@') ? (
                        <a 
                          href={`mailto:${session.hostContactInfo}`}
                          className="text-primary hover:underline flex items-center text-sm"
                        >
                          <FiMail className="mr-1" /> 
                          <span className="truncate max-w-[150px] sm:max-w-none">
                            {session.hostContactInfo}
                          </span>
                        </a>
                      ) : (
                        <a 
                          href={`tel:${session.hostContactInfo}`}
                          className="text-primary hover:underline flex items-center text-sm"
                        >
                          <FiPhone className="mr-1" /> {session.hostContactInfo}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Session Time */}
                {(session.startTime || session.endTime) && (
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-600 text-sm">Time:</span>
                    <div className="flex items-center text-sm">
                      <FiClock className="mr-1 text-gray-500" /> 
                      {session.startTime && session.endTime ? (
                        `${session.startTime} - ${session.endTime}`
                      ) : session.startTime ? (
                        `Starting at ${session.startTime}`
                      ) : (
                        `Ending at ${session.endTime}`
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-gray-600 text-sm">Your Rating:</span>
                  <div>
                    {renderRating(session.rating)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onSelectHost(session.hostId)}
                className="mt-4 w-full px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center justify-center text-sm sm:text-base"
              >
                <FiUser className="mr-1" /> View Host Details
              </button>
            </div>
            
            {/* Session Notes */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Session Notes</h3>
              
              {session.notes ? (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-md whitespace-pre-line text-gray-700 text-sm sm:text-base">
                  {session.notes}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-md text-gray-500 italic text-sm sm:text-base">
                  No notes recorded for this session.
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons - Responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-end mt-6 sm:mt-8 gap-2 sm:space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
            >
              Back to List
            </button>
            <button
              onClick={() => onEdit(session.id)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center justify-center text-sm sm:text-base"
            >
              <FiEdit className="mr-1" /> Edit Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}