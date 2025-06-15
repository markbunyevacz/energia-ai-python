// import { createClient } from '@lovable/client'; // Module not available

const lovableUrl = 'https://lovable.dev/projects/43008c28-d425-4379-852f-8aa5277d7415';
const lovableKey = import.meta.env.VITE_LOVABLE_KEY;

if (!lovableKey) {
  throw new Error('Missing Lovable.dev environment variables');
}

// Stub implementation for lovable client
export const createClient = (url: string, key: string) => {
  return {
    auth: {
      getSession: () => Promise.resolve(null),
      signInWithPassword: (_: { email: string; password: string }) => 
        Promise.resolve({ data: null, error: new Error('Lovable client not available') })
    }
  };
};

export const lovable = createClient(lovableUrl, lovableKey);

export const getLovableSession = async () => {
  try {
    const session = await lovable.auth.getSession();
    return session;
  } catch (error) {
    // console.error('Error getting Lovable.dev session:', error);
    return null;
  }
};

export const signInWithLovable = async (email: string, password: string) => {
  try {
    const { data, error } = await lovable.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    // console.error('Error signing in with Lovable.dev:', error);
    throw error;
  }
}; 
