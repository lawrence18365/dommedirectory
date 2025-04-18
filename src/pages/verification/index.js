import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useDropzone } from 'react-dropzone';
import Layout from '../../components/layout/Layout';
import { checkVerificationStatus, submitVerification } from '../../services/profiles';
import { createVerificationCheckout } from '../../services/payments';
import { getStripe } from '../../utils/stripe';

export default function Verification() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verification, setVerification] = useState({
    status: null,
    documents: [],
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function loadVerificationStatus() {
      try {
        const { verification, status, error } = await checkVerificationStatus(user.id);
        if (error) throw error;
        
        setVerification({
          status,
          documents: verification?.document_urls || [],
        });
      } catch (error) {
        console.error('Error loading verification status:', error);
        setError('Failed to load verification status. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadVerificationStatus();
  }, [user, router]);

  const onDrop = useCallback(acceptedFiles => {
    // Filter files larger than 10MB
    const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validFiles.length < acceptedFiles.length) {
      setError('Some files were too large and were not included. Max file size is 10MB.');
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one verification document.');
      return;
    }
    
    if (!agreeTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }
    
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    
    try {
      // 1. Upload each file to Supabase storage
      const documentUrls = [];
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('verification_docs')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL (or storage path)
        const { data } = supabase.storage
          .from('verification_docs')
          .getPublicUrl(filePath);
          
        documentUrls.push(data.publicUrl);
      }
      
      // 2. Submit verification request
      const { error: submitError } = await submitVerification(user.id, documentUrls);
      if (submitError) throw submitError;
      
      // 3. Redirect to payment
      const { sessionId, error: paymentError } = await createVerificationCheckout(user.id);
      if (paymentError) throw paymentError;
      
      // 4. Redirect to Stripe checkout
      const stripe = await getStripe();
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });
      
      if (stripeError) throw stripeError;
      
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  // If already verified, show status page
  if (verification.status === 'approved') {
    return (
      <Layout>
        <Head>
          <title>Verification | DommeDirectory</title>
          <meta name="description" content="Verification status on DommeDirectory" />
        </Head>

        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-green-700 text-white">
              <h1 className="text-xl font-bold">Verification Status</h1>
            </div>
            
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Profile is Verified
              </h2>
              
              <p className="text-gray-600 mb-6">
                Congratulations! Your profile verification is complete. Your profile now shows a verification badge to clients.
              </p>
              
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If verification is pending, show status page
  if (verification.status === 'pending') {
    return (
      <Layout>
        <Head>
          <title>Verification | DommeDirectory</title>
          <meta name="description" content="Verification status on DommeDirectory" />
        </Head>

        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-yellow-600 text-white">
              <h1 className="text-xl font-bold">Verification Status</h1>
            </div>
            
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification in Progress
              </h2>
              
              <p className="text-gray-600 mb-6">
                Your verification is currently being reviewed by our team. This process typically takes 24-48 hours. We'll notify you once it's complete.
              </p>
              
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If verification was rejected, show resubmit form
  if (verification.status === 'rejected') {
    return (
      <Layout>
        <Head>
          <title>Verification | DommeDirectory</title>
          <meta name="description" content="Verification status on DommeDirectory" />
        </Head>

        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-red-700 text-white">
              <h1 className="text-xl font-bold">Verification Status</h1>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Verification Not Approved
              </h2>
              
              <p className="text-gray-600 mb-6 text-center">
                Unfortunately, your verification documents were not approved. Please submit new documents following the guidelines below.
              </p>
              
              {/* Resubmit form - same as initial submission form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File upload section */}
                {/* Terms checkbox */}
                {/* Submit button */}
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Explicitly handle 'not_submitted' status before showing the form
  if (verification.status === 'not_submitted') {
    return (
      <Layout>
        <Head>
          <title>Verification | DommeDirectory</title>
          <meta name="description" content="Get your profile verified on DommeDirectory" />
        </Head>
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
             <p className="text-lg font-medium text-blue-800">Verification Status: Not Submitted</p>
             <p className="text-sm text-blue-600">Please submit your documents below to start the verification process.</p>
          </div>
          {/* Render the form below this status message */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
             <div className="px-4 py-5 sm:px-6 bg-purple-700 text-white">
               <h1 className="text-xl font-bold">Profile Verification</h1>
               <p className="mt-1 text-sm">
                 Complete verification to show clients your profile is legitimate
               </p>
             </div>

            {error && (
              <div className="px-4 py-3 sm:px-6 bg-red-50 text-red-700 border-b border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 sm:px-6 bg-green-50 text-green-700 border-b border-green-200">
                Verification submitted successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Document Upload</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Please upload a government-issued ID (passport, driver's license, or ID card) to verify your identity.
                </p>

                <div
                  {...getRootProps()}
                  className={`mt-4 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'} border-dashed rounded-md cursor-pointer`}
                >
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <input
                        {...getInputProps()}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                      />
                      <p className="pl-1">Drag and drop files here, or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Uploaded files:</h3>
                    <ul className="mt-2 divide-y divide-gray-200">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="py-2 flex justify-between items-center">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900">Verification Process</h2>
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>All verification documents are securely stored and handled with strict confidentiality.</li>
                    <li>The verification process typically takes 24-48 hours.</li>
                    <li>A one-time verification fee of $20 will be charged after document submission.</li>
                    <li>Approved profiles receive a verification badge visible to all users.</li>
                    <li>We may request additional documentation if necessary.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms(!agreeTerms)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    I agree to the verification terms and consent to document processing
                  </label>
                  <p className="text-gray-500">
                    By agreeing, you consent to our verification process and document storage policy.
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadedFiles.length === 0 || !agreeTerms}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // Fallback (should ideally not be reached if all statuses are handled)
  return (
    <Layout>
      <Head>
        <title>Verification | DommeDirectory</title>
        <meta name="description" content="Get your profile verified on DommeDirectory" />
      </Head>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-purple-700 text-white">
            <h1 className="text-xl font-bold">Profile Verification</h1>
            <p className="mt-1 text-sm">
              Complete verification to show clients your profile is legitimate
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 sm:px-6 bg-red-50 text-red-700 border-b border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 sm:px-6 bg-green-50 text-green-700 border-b border-green-200">
              Verification submitted successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Document Upload</h2>
              <p className="mt-1 text-sm text-gray-500">
                Please upload a government-issued ID (passport, driver's license, or ID card) to verify your identity.
              </p>
              
              <div 
                {...getRootProps()} 
                className={`mt-4 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'} border-dashed rounded-md cursor-pointer`}
              >
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <input
                      {...getInputProps()}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                    />
                    <p className="pl-1">Drag and drop files here, or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">Uploaded files:</h3>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="py-2 flex justify-between items-center">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Verification Process</h2>
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li>All verification documents are securely stored and handled with strict confidentiality.</li>
                  <li>The verification process typically takes 24-48 hours.</li>
                  <li>A one-time verification fee of $20 will be charged after document submission.</li>
                  <li>Approved profiles receive a verification badge visible to all users.</li>
                  <li>We may request additional documentation if necessary.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  I agree to the verification terms and consent to document processing
                </label>
                <p className="text-gray-500">
                  By agreeing, you consent to our verification process and document storage policy.
                </p>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadedFiles.length === 0 || !agreeTerms}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
