import React, { useEffect, useRef, useState } from 'react';
import { RiAccountCircleFill } from 'react-icons/ri';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure the full URL is constructed for the image
      setImage(parsedUser.profilePic ? parsedUser.profilePic : null);
    }
  }, []);

  // Handle when the profile icon is clicked
  const handleProfilePicClick = () => {
    fileInputRef.current?.click(); // Trigger the file input to open
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      return;
    }

    setLoading(true);
    setError(null);
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    const token = localStorage.getItem('authToken'); // Ensure token is fetched
    if (!token) {
      setError('Authentication token is missing or invalid');
      setLoading(false);
      return;
    }
  
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('User is not logged in');
      setLoading(false);
      return;
    }
  
    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser._id;  // Get the userId from localStorage
  
    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);  // Pass the userId dynamically in the request
  
    try {
      const response = await fetch('http://localhost:5000/api/user/upload-profile-pic', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,  // Add the token in the Authorization header
        },
        body: formData,
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload image');
        return;
      }
  
      const data = await response.json();
      if (data && data.data && data.data.profilePic) {
        const imageUrl = `${data.data.profilePic}?${Date.now()}`; // Prevent caching
  
        setImage(imageUrl);  // Update image in state
        onImageUpload(imageUrl); // Pass updated image URL to parent component
  
        const updatedUser = { ...parsedUser, profilePic: imageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Update user data in localStorage
      } else {
        setError('Unexpected response format from the server.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('An error occurred while uploading the image');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="image-upload">
      {loading ? (
        <div className="spinner-border text-light" role="status" />
      ) : (
        <>
          {image ? (
            <img
              key={image} // Force re-render when image changes
              src={image}
              alt="Profile"
              onClick={handleProfilePicClick}
              style={{ cursor: 'pointer', width: 50, height: 50, borderRadius: '50%' }}
            />
          ) : (
            <RiAccountCircleFill
              size={32}
              className="navbar-profile-icon"
              onClick={handleProfilePicClick}
              style={{ cursor: 'pointer' }}
            />
          )}
        </>
      )}
      {error && <div className="error-message">{error}</div>}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;