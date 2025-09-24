import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { postAdapter } from '../adapters';
import { useApp } from '../contexts/AppContext';
import { config } from '../config';
import { PRIVACY_LABELS } from '../utils/privacy';
import { PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import type { Post } from '../types';

export function PostPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [formData, setFormData] = useState({
    txt: '',
    privacy: 0 as Post['privacy'],
    tags: '',
    imageFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.txt.trim()) return;

    try {
      setLoading(true);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const postData = {
        user: config.CURRENT_USER_ID,
        privacy: formData.privacy,
        txt: formData.txt.trim(),
        tags: tags.length > 0 ? tags : undefined,
        links: [], // Could extract URLs from text in a real implementation
      };

      const newPost = await postAdapter.createPost(postData);
      
      showToast('Post created successfully!', 'success');
      
      // Navigate to appropriate feed based on privacy level
      const routes = {
        0: '/',
        1: '/following',
        2: '/close',
        3: '/private',
      };
      navigate(routes[formData.privacy]);
    } catch (error) {
      console.error('Failed to create post:', error);
      showToast('Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      setFormData(prev => ({ ...prev, imageFile: file }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Create Post</h2>
        <p className="text-text-muted">Share what's on your mind</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6">
        {/* Text Input */}
        <div className="mb-6">
          <label htmlFor="text" className="block text-sm font-medium text-text mb-2">
            What's happening?
          </label>
          <textarea
            id="text"
            value={formData.txt}
            onChange={(e) => setFormData(prev => ({ ...prev, txt: e.target.value }))}
            rows={6}
            maxLength={2000}
            className="w-full px-3 py-3 border border-border rounded-lg text-text placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Share your thoughts, experiences, or updates..."
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-text-muted">
              {formData.txt.length}/2000 characters
            </span>
            {formData.txt.length > 1800 && (
              <span className="text-xs text-orange-500">
                {2000 - formData.txt.length} characters remaining
              </span>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-2">
            Image (Optional)
          </label>
          
          {!formData.imageFile ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary-300 hover:bg-bg-soft transition-colors duration-150">
                <PhotoIcon className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-muted">
                  Click to upload an image
                </p>
                <p className="text-xs text-text-muted mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center justify-between p-3 bg-bg-soft rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <PhotoIcon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-text">{formData.imageFile.name}</span>
                  <span className="text-xs text-text-muted">
                    {(formData.imageFile.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tags Input */}
        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-text mb-2">
            Tags (Optional)
          </label>
          <div className="relative">
            <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="coding, travel, food (comma separated)"
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Separate tags with commas to help others find your post
          </p>
        </div>

        {/* Privacy Selector */}
        <div className="mb-6">
          <label htmlFor="privacy" className="block text-sm font-medium text-text mb-2">
            Privacy Level
          </label>
          <select
            id="privacy"
            value={formData.privacy}
            onChange={(e) => setFormData(prev => ({ ...prev, privacy: parseInt(e.target.value) as Post['privacy'] }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={0}>Public - Everyone can see this post</option>
            <option value={1}>Followers - Only your followers can see this</option>
            <option value={2}>Close Friends - Only close friends can see this</option>
            <option value={3}>Private - Only you can see this</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-text-muted">
              Posting to: <span className="font-medium text-primary-600">
                {PRIVACY_LABELS[formData.privacy]}
              </span>
            </span>
            <Button
              type="submit"
              loading={loading}
              disabled={!formData.txt.trim() || formData.txt.length > 2000}
            >
              Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}