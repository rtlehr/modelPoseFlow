import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllModelingSessions, deleteModelingSession } from "../lib/modelingSessionsService";
import type { ModelingSession } from "@shared/schema";
import HelpModal from "./HelpModal";
import { format } from "date-fns";
import { 
  FiPlusCircle, FiEdit, FiTrash2, FiInfo, 
  FiStar, FiDollarSign, FiUser, FiHelpCircle, FiFilter, FiCalendar,
  FiClock
} from "react-icons/fi";

interface ModelingSessionScreenProps {
  onBack: () => void;
  onSelectSession: (sessionId: number) => void;
  onGoToHostList: () => void;
  onAddSession: (hostId?: number) => void;
}

export default function ModelingSessionScreen({ 
  onBack, 
  onSelectSession, 
  onGoToHostList,
  onAddSession 
}: ModelingSessionScreenProps): JSX.Element {
  const [showHelp, setShowHelp] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'host' | 'pay'>('date');
  const queryClient = useQueryClient();

  // Fetch sessions
  const { 
    data: sessions = [], 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ['/api/modeling-sessions'], 
    queryFn: getAllModelingSessions 
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteModelingSession,
    onSuccess: () => {
      // Invalidate and refetch sessions after deletion
      queryClient.invalidateQueries({ queryKey: ['/api/modeling-sessions'] });
    }
  });

  const handleDeleteSession = (sessionId: number) => {
    if (window.confirm("Are you sure you want to delete this modeling session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  // Sort sessions based on selected criteria
  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
    } else if (sortBy === 'host') {
      return a.hostName.localeCompare(b.hostName);
    } else if (sortBy === 'pay') {
      const payA = a.pay || 0;
      const payB = b.pay || 0;
      return payB - payA;
    }
    return 0;
  });

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalEarnings = sessions.reduce((sum, session) => sum + (session.pay || 0), 0);
  const averageRating = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + session.rating, 0) / sessions.length 
    : 0;

  // Render stars for rating
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FiStar 
          key={i} 
          className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} 
          size={16}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Help content
  const helpInstructions = (
    <div className="space-y-4">
      <p>
        This screen allows you to track all of your figure modeling sessions with various hosts,
        keeping a record of dates, payments, and your experience.
      </p>
      
      <h3 className="text-lg font-medium">Features:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>View all your modeling sessions in one place</li>
        <li>Sort sessions by date, host, or payment</li>
        <li>Track your total earnings and average experience rating</li>
        <li>Add new sessions and edit existing ones</li>
        <li>Click on a host name to view all sessions with that host</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Keep detailed notes about each session for future reference</li>
        <li>Record payments accurately to track your modeling income</li>
        <li>Use the ratings to identify your preferred hosts over time</li>
      </ul>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading modeling sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <div className="text-red-500 text-5xl mb-4">
          <FiInfo />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Sessions</h2>
        <p className="text-gray-500 mb-6">
          There was a problem loading the modeling sessions. Please try again.
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
          <h1 className="text-2xl font-bold">Modeling Sessions</h1>
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
            onClick={onGoToHostList}
            className="ml-2 flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <FiUser className="mr-1" /> Manage Hosts
          </button>
          <button
            onClick={() => onAddSession()}
            className="ml-2 flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <FiPlusCircle className="mr-1" /> Add Session
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          title="Modeling Sessions Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Summary Panel */}
        <div className="w-full md:w-1/4 p-6 border-r bg-gray-50">
          <h2 className="text-xl font-semibold mb-6">Summary</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Sessions</h3>
              <p className="text-3xl font-bold">{totalSessions}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Earnings</h3>
              <p className="text-3xl font-bold text-green-600 flex items-center">
                <FiDollarSign className="mr-1" />{totalEarnings.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Rating</h3>
              <div className="flex items-center">
                <p className="text-3xl font-bold mr-2">{averageRating.toFixed(1)}</p>
                {renderRating(Math.round(averageRating))}
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-auto p-6">
          {/* Sort Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Sort by:</span>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${
                    sortBy === 'date' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiCalendar className={`mr-1 ${sortBy === 'date' ? 'text-primary' : ''}`} />
                  Date
                </button>
                <button
                  onClick={() => setSortBy('host')}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${
                    sortBy === 'host' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiUser className={`mr-1 ${sortBy === 'host' ? 'text-primary' : ''}`} />
                  Host
                </button>
                <button
                  onClick={() => setSortBy('pay')}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${
                    sortBy === 'pay' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiDollarSign className={`mr-1 ${sortBy === 'pay' ? 'text-primary' : ''}`} />
                  Pay
                </button>
              </div>
            </div>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-xl text-gray-500 mb-4">No modeling sessions found</p>
              <p className="text-gray-400 mb-6">Track your modeling work by adding sessions</p>
              <button
                onClick={() => onAddSession()}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <FiPlusCircle className="mr-1" /> Add Your First Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => onSelectSession(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold">{session.title}</h2>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToHostList();
                          }}
                          className="text-primary hover:underline text-sm mt-1"
                        >
                          {session.hostName}
                        </button>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-sm">
                          {format(new Date(session.sessionDate), 'MMMM d, yyyy')}
                        </span>
                        {(session.startTime || session.endTime) && (
                          <span className="text-gray-500 text-sm flex items-center mt-1">
                            <FiClock className="mr-1" />
                            {session.startTime && session.endTime 
                              ? `${session.startTime} - ${session.endTime}`
                              : session.startTime 
                                ? `Start: ${session.startTime}` 
                                : `End: ${session.endTime}`
                            }
                          </span>
                        )}
                        <div className="mt-1">{renderRating(session.rating)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      {session.pay ? (
                        <span className="text-green-600 font-semibold flex items-center">
                          <FiDollarSign className="mr-1" />{session.pay.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No payment recorded</span>
                      )}
                      
                      {session.notes && (
                        <p className="text-sm text-gray-500 line-clamp-1 max-w-md">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex border-t bg-gray-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(session.id);
                      }}
                      className="flex-1 py-2 flex justify-center items-center text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <FiEdit className="mr-1" /> Edit
                    </button>
                    
                    <div className="border-r"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="flex-1 py-2 flex justify-center items-center text-sm text-red-500 hover:bg-gray-100"
                    >
                      <FiTrash2 className="mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}