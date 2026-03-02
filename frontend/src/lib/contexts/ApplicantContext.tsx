/**
 * ApplicantContext - Manages manual applicant uploads and processing
 * 
 * Updated: August 23, 2025 - Henry Allen
 * - Added automatic processing for manual uploads (replaces database triggers)
 * - Manual uploads now trigger CV/LinkedIn/GitHub/AI processing directly
 * - Separated from ATS candidate processing flow
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Applicant, CreateApplicantRequest } from '@/lib/interfaces/applicant';
import { simpleDatabaseService } from '@/lib/services/database';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ApplicantContextType {
  applicants: Applicant[];
  selectedApplicant: Applicant | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchApplicants: () => Promise<void>;
  selectApplicant: (id: string | null) => Promise<void>;
  createApplicant: (request: CreateApplicantRequest) => Promise<string | null>;
  refreshApplicant: (id: string) => Promise<void>;
  deleteApplicant: (id: string) => Promise<void>;
}

const ApplicantContext = createContext<ApplicantContextType | undefined>(undefined);

export function ApplicantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to applicants table
  // Use a ref for the selected applicant id to avoid re-subscribing when it changes
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedApplicant?.id || null;
  }, [selectedApplicant?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    console.log(`🔌 Initializing stable real-time subscription for user ${user.id}`);

    const channel = supabase
      .channel('applicants-realtime')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'applicants',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {

        if (payload.eventType === 'INSERT') {
          const newApplicant = payload.new as Applicant;
          setApplicants(prev => {
            // Avoid duplicates
            if (prev.some(app => app.id === newApplicant.id)) return prev;
            return [newApplicant, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedApplicant = payload.new as Applicant;
          console.log(`🔄 Real-time update for applicant ${updatedApplicant.id}`, updatedApplicant);

          setApplicants(prev => prev.map(app =>
            app.id === updatedApplicant.id ? { ...app, ...updatedApplicant } : app
          ));

          // Update selected applicant if it's the one we are currently viewing
          // We use functional update to ensure we have the latest state and merge correctly
          if (selectedIdRef.current === updatedApplicant.id) {
            setSelectedApplicant(prev => {
              if (prev && prev.id === updatedApplicant.id) {
                return { ...prev, ...updatedApplicant };
              }
              return prev;
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string }).id;
          console.log(`🗑️ Real-time delete for applicant ${deletedId}`);
          setApplicants(prev => prev.filter(app => app.id !== deletedId));
          if (selectedIdRef.current === deletedId) {
            setSelectedApplicant(null);
          }
        }
      })
      .subscribe();

    return () => {
      console.log("🔌 Tearing down real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchApplicants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const applicants = await simpleDatabaseService.listUserApplicants();
      setApplicants(applicants || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applicants';
      setError(errorMessage);
      console.error('Error fetching applicants:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectApplicant = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedApplicant(null);
      return;
    }

    try {
      setError(null);
      const applicant = await simpleDatabaseService.getApplicant(id);
      setSelectedApplicant(applicant);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select applicant';
      setError(errorMessage);
      console.error('Error selecting applicant:', err);
    }
  }, []);

  // Function to wait for data processing completion before starting AI analysis (manual uploads only)
  const startAIAnalysisAfterDataCompletion = useCallback(async (applicantId: string) => {
    console.log(`⏳ Starting polling for data completion before AI analysis for ${applicantId}`);

    // Add initial delay to let data processing start
    await new Promise(resolve => setTimeout(resolve, 1000));

    const maxWaitTime = 60000; // 60 seconds max wait
    const pollInterval = 3000; // Check every 3 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`🔍 Polling status for ${applicantId}... (${Date.now() - startTime}ms elapsed)`);

        // Fetch current applicant status
        const currentApplicants = await simpleDatabaseService.listUserApplicants();
        const applicant = currentApplicants.find(a => a.id === applicantId);

        if (!applicant) {
          console.error(`❌ Applicant ${applicantId} not found during polling`);
          return;
        }

        console.log(`📊 Current status for ${applicantId}: CV=${applicant.cv_status}, LI=${applicant.li_status}, GH=${applicant.gh_status}, AI=${applicant.ai_status}`);

        // Check if all data sources are done processing
        const cvDone = applicant.cv_status !== 'processing' && applicant.cv_status !== 'pending';
        const liDone = applicant.li_status !== 'processing' && applicant.li_status !== 'pending';
        const ghDone = applicant.gh_status !== 'processing' && applicant.gh_status !== 'pending';
        const lcDone = applicant.lc_status !== 'processing' && applicant.lc_status !== 'pending';

        if (cvDone && liDone && ghDone && lcDone) {
          console.log(`✅ All data processing completed for ${applicantId} after ${Date.now() - startTime}ms - starting AI analysis now`);

          // Now start AI analysis
          try {
            const response = await fetch('/api/analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicant_id: applicantId
              })
            });

            if (response.ok) {
              console.log(`✅ AI analysis successfully started for ${applicantId}`);
            } else {
              console.error(`❌ AI analysis failed for ${applicantId}: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ AI analysis error for ${applicantId}:`, error);
          }

          return;
        }

        console.log(`⏳ Still waiting for data processing completion for ${applicantId}... CV=${applicant.cv_status}, LI=${applicant.li_status}, GH=${applicant.gh_status}, LC=${applicant.lc_status}`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error(`❌ Error polling applicant status for ${applicantId}:`, error);
        break;
      }
    }

    console.log(`⚠️ Timeout waiting for data processing completion for ${applicantId} after ${maxWaitTime}ms - starting AI analysis anyway`);

    // Start AI analysis anyway after timeout
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_id: applicantId
        })
      });

      if (response.ok) {
        console.log(`✅ AI analysis started for ${applicantId} (after timeout)`);
      } else {
        console.error(`❌ AI analysis failed for ${applicantId} (after timeout): ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ AI analysis error for ${applicantId} (after timeout):`, error);
    }
  }, []);

  const createApplicant = useCallback(async (request: CreateApplicantRequest): Promise<string | null> => {
    if (!user?.id) {
      setError('User must be authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      let cv_file_id: string | null = null;

      // Handle CV file upload if provided
      if (request.cvFile) {
        console.log(`📁 Uploading CV file for user ${user.id}`);

        // Upload file to Supabase Storage
        const storagePath = `${user.id}/${Date.now()}_${request.cvFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('candidate-cvs')
          .upload(storagePath, request.cvFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Create file record
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            file_type: 'cv',
            original_filename: request.cvFile.name,
            storage_path: storagePath,
            storage_bucket: 'candidate-cvs',
            file_size: request.cvFile.size,
            mime_type: request.cvFile.type
          })
          .select()
          .single();

        if (fileError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage.from('candidate-cvs').remove([storagePath]);
          throw new Error(`Failed to create file record: ${fileError.message}`);
        }

        cv_file_id = fileRecord.id;
      }

      // Create applicant record - triggers will handle automatic processing
      console.log(`👤 Creating applicant record for user ${user.id}`);
      const { data: applicant, error: applicantError } = await supabase
        .from('applicants')
        .insert({
          user_id: user.id,
          name: 'Processing...',
          email: null,
          phone: null,
          linkedin_url: request.linkedinUrl || null,
          github_url: request.githubUrl || null,
          leetcode_url: request.leetcodeUrl || null,
          cv_file_id,
          // Status columns will be set based on what data we have
          cv_status: cv_file_id ? 'pending' : 'ready',
          li_status: request.linkedinUrl
            ? (process.env.NEXT_PUBLIC_LINKEDIN_SCRAPING_ENABLED === 'false' ? 'ready' : 'pending')
            : 'not_provided',
          gh_status: request.githubUrl ? 'pending' : 'not_provided',
          lc_status: request.leetcodeUrl ? 'pending' : 'not_provided',
          ai_status: 'pending'
          // Note: status is now a generated column - automatically derived from sub-statuses
        })
        .select()
        .single();

      if (applicantError) {
        // Clean up file if applicant creation fails
        if (cv_file_id) {
          await supabase.from('files').delete().eq('id', cv_file_id);
          if (request.cvFile) {
            const storagePath = `${user.id}/${Date.now()}_${request.cvFile.name}`;
            await supabase.storage.from('candidate-cvs').remove([storagePath]);
          }
        }
        throw new Error(`Failed to create applicant: ${applicantError.message}`);
      }

      console.log(`✅ Created applicant ${applicant.id} - real-time will handle UI updates`);

      // Automatically start processing for manual uploads
      // Note: This replaces database triggers that were causing net.http_post errors
      // Manual uploads now trigger processing directly in the client context
      // ATS candidates use separate manual "Process Selected" flow
      if (cv_file_id || request.linkedinUrl || request.githubUrl || request.leetcodeUrl) {
        console.log(`🚀 Starting automatic processing for applicant ${applicant.id}`);

        // Start CV processing if we have a CV
        if (cv_file_id) {
          (async () => {
            try {
              const response = await fetch('/api/cv-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicant_id: applicant.id,
                  file_id: cv_file_id
                })
              });

              if (response.ok) {
                console.log(`✅ CV processing started for ${applicant.id}`);
              } else {
                const errorText = await response.text();
                console.error(`❌ CV processing failed for ${applicant.id}: ${response.status}`, errorText);
              }
            } catch (error) {
              console.error(`❌ CV processing error for ${applicant.id}:`, error);
            }
          })();
        }

        // Start LinkedIn processing if we have LinkedIn URL and scraping is enabled
        const linkedinScrapingEnabled = process.env.NEXT_PUBLIC_LINKEDIN_SCRAPING_ENABLED !== 'false';
        if (request.linkedinUrl && linkedinScrapingEnabled) {
          (async () => {
            try {
              const response = await fetch('/api/linkedin-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicant_id: applicant.id,
                  linkedin_url: request.linkedinUrl
                })
              });

              if (response.ok) {
                console.log(`✅ LinkedIn processing started for ${applicant.id}`);
              } else {
                const errorText = await response.text();
                console.error(`❌ LinkedIn processing failed for ${applicant.id}: ${response.status}`, errorText);
              }
            } catch (error) {
              console.error(`❌ LinkedIn processing error for ${applicant.id}:`, error);
            }
          })();
        }

        // Start GitHub processing if we have GitHub URL
        if (request.githubUrl) {
          (async () => {
            try {
              const response = await fetch('/api/github-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicant_id: applicant.id,
                  github_url: request.githubUrl
                })
              });

              if (response.ok) {
                console.log(`✅ GitHub processing started for ${applicant.id}`);
              } else {
                const errorText = await response.text();
                console.error(`❌ GitHub processing failed for ${applicant.id}: ${response.status}`, errorText);
              }
            } catch (error) {
              console.error(`❌ GitHub processing error for ${applicant.id}:`, error);
            }
          })();
        }

        // Start LeetCode processing if we have LeetCode URL
        if (request.leetcodeUrl) {
          (async () => {
            try {
              const response = await fetch('/api/leetcode-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicant_id: applicant.id,
                  leetcode_url: request.leetcodeUrl
                })
              });

              if (response.ok) {
                console.log(`✅ LeetCode processing started for ${applicant.id}`);
              } else {
                const errorText = await response.text();
                console.error(`❌ LeetCode processing failed for ${applicant.id}: ${response.status}`, errorText);
              }
            } catch (error) {
              console.error(`❌ LeetCode processing error for ${applicant.id}:`, error);
            }
          })();
        }

        // Start AI analysis after data processing completes
        console.log(`🔄 Starting intelligent AI analysis polling for manual upload ${applicant.id}`);
        startAIAnalysisAfterDataCompletion(applicant.id).catch(error => {
          console.error(`❌ Error in startAIAnalysisAfterDataCompletion for ${applicant.id}:`, error);
        });
      }

      // Don't manually update state - real-time subscription will handle it
      return applicant.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create applicant';
      setError(errorMessage);
      console.error('Error creating applicant:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, startAIAnalysisAfterDataCompletion]);

  const refreshApplicant = useCallback(async (id: string) => {
    // Note: With real-time subscriptions, manual refresh is rarely needed
    // This method is kept for compatibility but real-time updates handle most cases
    try {
      setError(null);
      const updatedApplicant = await simpleDatabaseService.getApplicant(id);

      if (updatedApplicant) {
        setApplicants(prev =>
          prev.map(applicant =>
            applicant.id === id ? updatedApplicant : applicant
          )
        );

        if (selectedApplicant?.id === id) {
          setSelectedApplicant(updatedApplicant);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh applicant';
      setError(errorMessage);
      console.error('Error refreshing applicant:', err);
    }
  }, [selectedApplicant?.id]);

  const deleteApplicant = useCallback(async (id: string) => {
    if (!user?.id) {
      setError('User must be authenticated');
      return;
    }

    try {
      setError(null);
      const supabase = createClient();

      // Delete from database - real-time subscription will handle UI updates
      const { error } = await supabase
        .from('applicants')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own applicants

      if (error) {
        throw new Error(`Failed to delete applicant: ${error.message}`);
      }

      // Real-time subscription will handle state updates automatically
      console.log(`🗑️ Deleted applicant ${id} - real-time will handle UI updates`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete applicant';
      setError(errorMessage);
      console.error('Error deleting applicant:', err);
      throw err;
    }
  }, [user?.id]);

  const contextValue: ApplicantContextType = {
    applicants,
    selectedApplicant,
    isLoading,
    error,
    fetchApplicants,
    selectApplicant,
    createApplicant,
    refreshApplicant,
    deleteApplicant,
  };

  return (
    <ApplicantContext.Provider value={contextValue}>
      {children}
    </ApplicantContext.Provider>
  );
}

export function useApplicants() {
  const context = useContext(ApplicantContext);
  if (context === undefined) {
    throw new Error('useApplicants must be used within an ApplicantProvider');
  }
  return context;
}
