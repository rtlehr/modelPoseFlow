import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHost, getModelingSessionsByHostId } from "../lib/modelingSessionsService";
import type { Host, ModelingSession } from "@shared/schema";
import HelpModal from "./HelpModal";
import { format } from "date-fns";
import { 
  FiStar, FiPhone, FiMail, FiGlobe, FiMapPin, 
  FiInfo, FiPlusCircle, FiHelpCircle, FiEdit, FiDollarSign
} from "react-icons/fi";

interface HostDetailScreenProps {
  hostId: number;
  onBack: () => void;
  onEditHost: (hostId: number) => void;
  onSelectSession: (sessionId: number) => void;
  onAddSession: (hostId: number) => void;
}

export default function HostDetailScreen({ 
  hostId, 
  onBack, 
  onEditHost, 
  onSelectSession, 
  onAddSession 
}: HostDetailScreenProps): JSX.Element {
  const [showHelp, setShowHelp] = useState(false);

  // Fetch host details
  const { 
    data: host, 
    isLoading: isLoadingHost, 
    error: hostError 
  } = useQuery({ 
    queryKey: [`/api/hosts/${hostId}`], 
    queryFn: () => getHost(hostId),
  });

  // Fetch host's modeling sessions
  const { 
    data: sessions = [], 
    isLoading: isLoadingSessions, 
    error: sessionsError 
  } = useQuery({ 
    queryKey: [`/api/hosts/${hostId}/modeling-sessions`], 
    queryFn: () => getModelingSessionsByHostId(hostId),
  });

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
        This screen shows you detailed information about a specific host and all modeling sessions you've done with them.
      </p>
      
      <h3 className="text-lg font-medium">Features:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>View all contact information for this host</li>
        <li>See your overall rating for this host</li>
        <li>Add new modeling sessions with this host</li>
        <li>View all past modeling sessions in chronological order</li>
        <li>Track your total earnings from sessions with this host</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Click on any session to view or edit its details</li>
        <li>Use the Edit Host button to update contact information</li>
        <li>Add detailed notes about your experience with this host</li>
      </ul>
    </div>
  );

  const isLoading = isLoadingHost || isLoadingSessions;
  const error = hostError || sessionsError;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading host details...</p>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <div className="text-red-500 text-5xl mb-4">
          <FiInfo />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Host</h2>
        <p className="text-gray-500 mb-6">
          There was a problem loading the host details. Please try again.
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

  // Calculate total earnings from this host
  const totalEarnings = sessions.reduce((sum, session) => sum + (session.pay || 0), 0);

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
  });

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
          <h1 className="text-2xl font-bold">{host.name}</h1>
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
            onClick={() => onEditHost(host.id)}
            className="ml-2 flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            <FiEdit className="mr-1" /> Edit Host
          </button>
          <button
            onClick={() => onAddSession(host.id)}
            className="ml-2 flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <FiPlusCircle className="mr-1" /> Add Session
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          title="Host Details Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Host Details and Session List */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Host Info Panel */}
        <div className="w-full md:w-1/3 p-6 border-r overflow-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Host Information</h2>
              {renderRating(host.rating)}
            </div>

            <div className="space-y-4">
              {host.address && (
                <div className="flex items-start">
                  <FiMapPin className="mr-2 mt-1 flex-shrink-0 text-gray-500" />
                  <p className="text-gray-700">{host.address}</p>
                </div>
              )}
              
              {host.contactNumber && (
                <div className="flex items-center">
                  <FiPhone className="mr-2 text-gray-500" />
                  <p className="text-gray-700">{host.contactNumber}</p>
                </div>
              )}
              
              {host.email && (
                <div className="flex items-center">
                  <FiMail className="mr-2 text-gray-500" />
                  <a 
                    href={`mailto:${host.email}`}
                    className="text-primary hover:underline"
                  >
                    {host.email}
                  </a>
                </div>
              )}
              
              {host.website && (
                <div className="flex items-center">
                  <FiGlobe className="mr-2 text-gray-500" />
                  <a 
                    href={host.website.startsWith('http') ? host.website : `https://${host.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {host.website}
                  </a>
                </div>
              )}
            </div>

            {host.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-line">
                  {host.notes}
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Session Stats</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Total Sessions:</span>
                <span className="font-semibold">{sessions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Earnings:</span>
                <span className="font-semibold text-green-600 flex items-center">
                  <FiDollarSign className="mr-1" />{totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Modeling Sessions</h2>
            <button
              onClick={() => onAddSession(host.id)}
              className="flex items-center text-sm px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              <FiPlusCircle className="mr-1" /> Add
            </button>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-xl text-gray-500 mb-4">No modeling sessions yet</p>
              <p className="text-gray-400 mb-6">Add your first session with this host</p>
              <button
                onClick={() => onAddSession(host.id)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <FiPlusCircle className="mr-1" /> Add Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{session.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {format(new Date(session.sessionDate), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {session.pay ? (
                        <span className="text-green-600 font-semibold flex items-center">
                          <FiDollarSign className="mr-1" />{session.pay.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No payment recorded</span>
                      )}
                      <div className="mt-1">{renderRating(session.rating)}</div>
                    </div>
                  </div>
                  
                  {session.notes && (
                    <p className="mt-2 text-gray-600 text-sm line-clamp-2">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}