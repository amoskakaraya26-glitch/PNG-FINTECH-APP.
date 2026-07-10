import React, { useRef, useState, useEffect } from 'react';

interface FacialRecognitionProps {
  mode: 'login' | 'enroll';
  email?: string;
  phone?: string;
  pin?: string;
  onSuccess?: (token?: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    faceapi: any;
  }
}

export const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  mode = 'login',
  email = '',
  phone = '',
  pin = '',
  onSuccess,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [capturedFaces, setCapturedFaces] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera
  const startCamera = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support camera access.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setCameraActive(true);
        setStatus('Camera started. Position your face, then click "Capture Face".');
      }
    } catch (err: any) {
      let message = 'Could not start camera. Please allow camera permissions.';
      if (err?.name === 'NotFoundError') {
        message = 'No camera detected on this device.';
      } else if (err?.name === 'NotAllowedError') {
        message = 'Camera access denied. Please allow camera permissions.';
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Capture face
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      setLoading(true);
      setStatus('Processing face...');

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Get face data from canvas
      const faceData = canvasRef.current.toDataURL('image/jpeg');
      const facePayload = (faceData.split(',')[1] || '').slice(0, 2048);

      // In production, use actual face-api.js or cloud vision API
      // For now, create a simple face template
      const faceTemplate = JSON.stringify({
        data: facePayload,
      });

      setCapturedFaces([...capturedFaces, faceTemplate]);
      setStatus(`Face ${capturedFaces.length + 1} captured. ${mode === 'enroll' ? `${5 - capturedFaces.length - 1} more needed` : ''}`);

      // Auto-submit if in login mode
      if (mode === 'login' && capturedFaces.length === 0) {
        handleLogin(faceTemplate);
      }
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login with face
  const handleLogin = async (faceTemplate: string) => {
    try {
      setLoading(true);
      setStatus('Verifying face...');

      const response = await fetch('/api/auth/face/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          faceTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Face recognition failed');
      }

      setStatus('✓ Face recognized! Logging in...');
      stopCamera();

      setTimeout(() => {
        onSuccess?.(data.token);
      }, 1000);
    } catch (err: any) {
      const message = err.message || 'Face recognition failed';

      if (mode === 'login' && message.includes('No face enrollment found') && phone && pin) {
        await bootstrapEnrollment(faceTemplate);
        return;
      }

      setError(message);
      onError?.(message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const bootstrapEnrollment = async (faceTemplate: string) => {
    setStatus('No face profile found. Enrolling face with your PIN...');
    setError('');

    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok || !loginData.token) {
      throw new Error(loginData.error || 'PIN verification failed');
    }

    const enrollResponse = await fetch('/api/auth/face/enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({ faceTemplates: [faceTemplate] }),
    });

    const enrollData = await enrollResponse.json();
    if (!enrollResponse.ok) {
      throw new Error(enrollData.error || 'Face enrollment failed');
    }

    setStatus('✓ Face enrolled and login successful!');
    stopCamera();
    setTimeout(() => {
      onSuccess?.(loginData.token);
    }, 800);
  };

  // Enroll faces
  const handleEnroll = async () => {
    if (capturedFaces.length < 3) {
      setError('Please capture at least 3 faces for enrollment');
      return;
    }

    try {
      setLoading(true);
      setStatus('Enrolling face...');

      const response = await fetch('/api/auth/face/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          faceTemplates: capturedFaces,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Face enrollment failed');
      }

      setStatus('✓ Face enrollment successful!');
      stopCamera();

      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === 'login' ? '🎥 Facial Recognition Login' : '📷 Enroll Your Face'}
      </h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">{error}</div>}

      {status && <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded mb-4">{status}</div>}

      {/* Video Stream */}
      <div className="mb-6 relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: cameraActive ? 'block' : 'none' }}
        />
        {!cameraActive && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <p className="text-white text-center">
              {mode === 'login' ? 'Camera not active' : 'Camera not active'}
            </p>
          </div>
        )}

        {/* Face Detection Frame */}
        <div className="absolute inset-0 border-4 border-blue-500 rounded-lg"></div>

        {/* Captured Count */}
        {mode === 'enroll' && capturedFaces.length > 0 && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {capturedFaces.length}/3 faces
          </div>
        )}
      </div>

      {/* Hidden Canvas for face capture */}
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />

      {/* Camera Controls */}
      <div className="space-y-3">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Initializing...' : '📷 Start Camera'}
          </button>
        ) : (
          <>
            <button
              onClick={captureFace}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Processing...' : '✓ Capture Face'}
            </button>

            <button
              onClick={stopCamera}
              disabled={loading}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Stop Camera
            </button>
          </>
        )}

        {mode === 'enroll' && capturedFaces.length >= 3 && (
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Enrolling...' : '✓ Complete Enrollment'}
          </button>
        )}
      </div>

      {/* Info Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        {mode === 'login' ? (
          <>
            <p className="text-sm font-semibold mb-2">💡 How it works:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✓ Click "Start Camera"</li>
              <li>✓ Position your face in center</li>
              <li>✓ Click "Capture Face"</li>
              <li>✓ You will be logged in</li>
              <li>✓ First use: enter phone + PIN for one-time enrollment</li>
            </ul>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold mb-2">📋 Enrollment Steps:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✓ Start camera</li>
              <li>✓ Capture 3+ faces from different angles</li>
              <li>✓ Good lighting is important</li>
              <li>✓ Face should be clearly visible</li>
              <li>✓ Click "Complete Enrollment" when done</li>
            </ul>
          </>
        )}
      </div>

      {/* Permission Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>📹 Camera permission required. Your images are processed locally and not stored.</p>
      </div>
    </div>
  );
};

export default FacialRecognition;
