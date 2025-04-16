import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllHosts, createHost, deleteHost } from "@lib/modelingSessionsService";
import type { Host } from "@shared/schema";
import HelpModal from "./HelpModal";
import { FiPlusCircle, FiEdit, FiTrash2, FiInfo, FiStar, FiPhone, FiMail, FiGlobe, FiHelpCircle } from "react-icons/fi";

interface HostListScreenProps {
  onBack: () => void;
  onSelectHost: (hostId: number) => void;
  onAddNewHost: () => void;
  onEditHost: (hostId: number) => void;
}

export default function HostListScreen({ 
  onBack, 
  onSelectHost, 
  onAddNewHost, 
  onEditHost 
}: HostListScreenProps): JSX.Element {
  const [showHelp, setShowHelp] = useState(false);
  const queryClient = useQueryClient();

  // Fetch hosts
  const { 
    data: hosts = [], 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ['/api/hosts'], 
    queryFn: getAllHosts 
  });

  // Delete host mutation
  const deleteHostMutation = useMutation({
    mutationFn: deleteHost,
    onSuccess: () => {
      // Invalidate and refetch hosts after deletion
      queryClient.invalidateQueries({ queryKey: ['/api/hosts'] });
    }
  });

  const handleDeleteHost = (hostId: number) => {
    if (window.confirm("Are you sure you want to delete this host? This will also delete all associated modeling sessions.")) {
      deleteHostMutation.mutate(hostId);
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
        The Host Management screen allows you to manage the organizations, studios, or individuals 
        who host modeling sessions.
      </p>
      
      <h3 className="text-lg font-medium">Features:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>View a list of all your hosts with their contact information</li>
        <li>Add new hosts with their details</li>
        <li>Edit existing host information</li>
        <li>Delete hosts (this will also delete all associated sessions)</li>
        <li>View all modeling sessions for a specific host</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Use ratings to keep track of your experience with different hosts</li>
        <li>Add detailed notes about your interactions and the working environment</li>
        <li>Keep contact information up to date for easy communication</li>
      </ul>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading hosts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6">
        <div className="text-red-500 text-5xl mb-4">
          <FiInfo />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Hosts</h2>
        <p className="text-gray-500 mb-6">
          There was a problem loading the host data. Please try again.
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
          <h1 className="text-2xl font-bold">Host Management</h1>
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
            onClick={onAddNewHost}
            className="ml-2 flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            <FiPlusCircle className="mr-1" /> Add Host
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <HelpModal
          title="Host Management Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Host List */}
      <div className="flex-1 overflow-auto p-4">
        {hosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xl text-gray-500 mb-4">No hosts found</p>
            <p className="text-gray-400 mb-6">Add a host to track modeling sessions by organization</p>
            <button
              onClick={onAddNewHost}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              <FiPlusCircle className="mr-1" /> Add Your First Host
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hosts.map((host) => (
              <div
                key={host.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => onSelectHost(host.id)}
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold truncate">{host.name}</h2>
                    {renderRating(host.rating)}
                  </div>
                  
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    {host.address && (
                      <p className="truncate">{host.address}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-2">
                      {host.contactNumber && (
                        <span className="flex items-center">
                          <FiPhone className="mr-1" />
                          {host.contactNumber}
                        </span>
                      )}
                      
                      {host.email && (
                        <span className="flex items-center">
                          <FiMail className="mr-1" />
                          {host.email}
                        </span>
                      )}
                      
                      {host.website && (
                        <span className="flex items-center">
                          <FiGlobe className="mr-1" />
                          <a 
                            href={host.website.startsWith('http') ? host.website : `https://${host.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {host.notes && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {host.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex border-t bg-gray-50">
                  <button
                    onClick={() => onEditHost(host.id)}
                    className="flex-1 py-2 flex justify-center items-center text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <FiEdit className="mr-1" /> Edit
                  </button>
                  
                  <div className="border-r"></div>
                  
                  <button
                    onClick={() => handleDeleteHost(host.id)}
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
  );
}