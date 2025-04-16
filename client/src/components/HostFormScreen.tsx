import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHost, createHost, updateHost } from "@lib/modelingSessionsService";
import type { Host } from "@shared/schema";
import HelpModal from "./HelpModal";
import { FiHelpCircle, FiStar } from "react-icons/fi";

interface HostFormScreenProps {
  hostId?: number; // If provided, we're editing an existing host
  onBack: () => void;
  onSaved: (hostId: number) => void;
}

export default function HostFormScreen({ 
  hostId, 
  onBack, 
  onSaved 
}: HostFormScreenProps): JSX.Element {
  const queryClient = useQueryClient();
  const [showHelp, setShowHelp] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(3); // Default to middle rating
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // If hostId is provided, fetch existing host data
  const { data: existingHost, isLoading } = useQuery({
    queryKey: [`/api/hosts/${hostId}`],
    queryFn: () => getHost(hostId || 0),
    enabled: !!hostId, // Only run query if hostId is provided
  });
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (existingHost) {
      setName(existingHost.name);
      setAddress(existingHost.address || "");
      setContactNumber(existingHost.contactNumber || "");
      setEmail(existingHost.email || "");
      setWebsite(existingHost.website || "");
      setNotes(existingHost.notes || "");
      setRating(existingHost.rating);
    }
  }, [existingHost]);
  
  // Create host mutation
  const createHostMutation = useMutation({
    mutationFn: createHost,
    onSuccess: (newHost) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hosts'] });
      onSaved(newHost.id);
    }
  });
  
  // Update host mutation
  const updateHostMutation = useMutation({
    mutationFn: ({ id, host }: { id: number; host: Partial<Host> }) => 
      updateHost(id, host),
    onSuccess: (updatedHost) => {
      queryClient.invalidateQueries({ queryKey: [`/api/hosts/${hostId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/hosts'] });
      onSaved(updatedHost.id);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Host name is required";
    }
    
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (website && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?].*)?$/.test(website)) {
      newErrors.website = "Invalid website format";
    }
    
    setErrors(newErrors);
    
    // If no validation errors, submit the form
    if (Object.keys(newErrors).length === 0) {
      const hostData = {
        name,
        address: address || null,
        contactNumber: contactNumber || null,
        email: email || null,
        website: website || null,
        notes: notes || null,
        rating
      };
      
      if (hostId) {
        // Update existing host
        updateHostMutation.mutate({ id: hostId, host: hostData });
      } else {
        // Create new host
        createHostMutation.mutate(hostData);
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
        Use this form to {hostId ? "edit an existing" : "add a new"} host for your modeling sessions.
      </p>
      
      <h3 className="text-lg font-medium">Form Fields:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Name</strong> - Required. The name of the studio, organization, or individual host</li>
        <li><strong>Address</strong> - The physical location where modeling sessions take place</li>
        <li><strong>Contact Number</strong> - Phone number for the host</li>
        <li><strong>Email</strong> - Email address for the host</li>
        <li><strong>Website</strong> - The host's website URL</li>
        <li><strong>Notes</strong> - Any additional information about this host</li>
        <li><strong>Rating</strong> - Your personal rating for this host (1-5 stars)</li>
      </ul>
      
      <h3 className="text-lg font-medium">Tips:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Include detailed notes about the working environment, compensation, and any special considerations</li>
        <li>You can always update this information later</li>
        <li>A centralized record helps you track and compare different hosts over time</li>
      </ul>
    </div>
  );
  
  // Show loading state if fetching existing host data
  if (hostId && isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading host details...</p>
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
            {hostId ? "Edit Host" : "Add New Host"}
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
          title={`${hostId ? "Edit" : "Add"} Host Help`}
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Host Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter host name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Address Field */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter address (optional)"
                rows={2}
              />
            </div>

            {/* Contact Number Field */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium mb-1">
                Contact Number
              </label>
              <input
                id="contactNumber"
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter contact number (optional)"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email (optional)"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Website Field */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1">
                Website
              </label>
              <input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  errors.website ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter website URL (optional)"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-500">{errors.website}</p>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Add any notes about this host (optional)"
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
                disabled={createHostMutation.isPending || updateHostMutation.isPending}
              >
                {createHostMutation.isPending || updateHostMutation.isPending
                  ? "Saving..."
                  : hostId
                  ? "Update Host"
                  : "Add Host"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}