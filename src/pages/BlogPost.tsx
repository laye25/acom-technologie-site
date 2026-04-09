import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { dbService as db } from '../services/dbService';
import { BLOG_POSTS as STATIC_POSTS } from '../constants';
import { BlogPost as BlogPostType } from '../types';
import { motion } from 'motion/react';
import { Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { OptimizedImage } from '../components/OptimizedImage';

const BlogPost = () => {
  const { postId } = useParams();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoading(true);

      try {
        const data = await db.blog.getById(postId);
        
        if (data) {
          setPost(data);
          
          // Fetch related posts
          const related = await db.blog.getRelated(data.category, postId);
          if (related) setRelatedPosts(related);
        } else {
          // Fallback to static data
          const staticPost = STATIC_POSTS.find(p => p.id === postId);
          if (staticPost) {
            setPost(staticPost);
            const related = STATIC_POSTS
              .filter(p => p.category === staticPost.category && p.id !== postId)
              .slice(0, 2);
            setRelatedPosts(related);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        const staticPost = STATIC_POSTS.find(p => p.id === postId);
        if (staticPost) {
          setPost(staticPost);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
        <div className="h-12 w-3/4 bg-gray-200 rounded mb-6" />
        <div className="h-64 w-full bg-gray-200 rounded-3xl mb-12" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!post) return <Navigate to="/blog" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link 
          to="/blog" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au blog
        </Link>

        <div className="mb-8">
          <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
            {post.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold mr-3">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{post.author}</p>
                <p className="text-xs">Auteur</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {post.date}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {post.readTime} de lecture
            </div>
            <button className="ml-auto p-2 text-gray-400 hover:text-primary transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="aspect-video rounded-3xl overflow-hidden mb-12 shadow-lg">
          <OptimizedImage 
            src={post.image} 
            alt={post.title} 
            width={1200}
            className="w-full h-full object-cover"
          />
        </div>

        <div 
          className="prose prose-lg max-w-none prose-primary prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Articles similaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map(related => (
                <Link 
                  key={related.id} 
                  to={`/blog/${related.id}`}
                  className="group"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                    <OptimizedImage 
                      src={related.image} 
                      alt={related.title} 
                      width={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BlogPost;
