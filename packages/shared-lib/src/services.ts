import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from 'shared-types';

export const submitWorkerApplication = async (
  supabase: SupabaseClient<Database>,
  applicantId: string, // auth.users.id
  societyId: string,
  serviceType: Database['public']['Enums']['service_type'],
  homeLocation: { lat: number; lng: number },
  radiusMeters: number
) => {
  // Update the user's role to 'worker' and set their society_id in the profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'worker',
      society_id: societyId 
    })
    .eq('id', applicantId);

  if (profileError) throw profileError;

  // Insert into worker_profiles
  const pointStr = `POINT(${homeLocation.lng} ${homeLocation.lat})`;
  
  const { error: workerProfileError } = await supabase
    .from('worker_profiles')
    .insert({
      profile_id: applicantId,
      home_location: pointStr as any, // PostGIS Point string
      service_area_radius_m: radiusMeters,
      verified: false,
      available: true,
      insurance_status: 'enrolled'
    });
    
  if (workerProfileError) throw workerProfileError;

  // Insert into worker_skills
  const { error: skillsError } = await supabase
    .from('worker_skills')
    .insert({
      worker_id: applicantId,
      service_type: serviceType
    });

  if (skillsError) throw skillsError;

  return { success: true };
};

export const verifyWorker = async (
  supabase: SupabaseClient<Database>,
  workerId: string
) => {
  // In a real app this should be an EDGE FUNCTION to securely enforce caller is society_admin
  const { error } = await supabase
    .from('worker_profiles')
    .update({ verified: true })
    .eq('profile_id', workerId);
    
  if (error) throw error;
  return { success: true };
};
